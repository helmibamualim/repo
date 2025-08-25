-- Database Schema untuk Website Poker Online Gratis - Texas Hold'em
-- PostgreSQL Database

-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users (Data akun pengguna)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth DATE,
    country VARCHAR(50),
    city VARCHAR(100),
    
    -- OAuth fields
    google_id VARCHAR(100),
    facebook_id VARCHAR(100),
    
    -- Game stats
    total_games_played INTEGER DEFAULT 0,
    total_games_won INTEGER DEFAULT 0,
    total_chips_won BIGINT DEFAULT 0,
    total_chips_lost BIGINT DEFAULT 0,
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    ban_until TIMESTAMP,
    
    -- Referral
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_referral_code (referral_code)
);

-- Table: chips_wallet (Saldo chip tiap user)
CREATE TABLE chips_wallet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT DEFAULT 5000000, -- Bonus awal 5 juta chip
    total_purchased BIGINT DEFAULT 0,
    total_bonus_received BIGINT DEFAULT 5000000, -- Bonus awal
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id),
    CHECK (balance >= 0)
);

-- Table: tables (Info meja & pemain)
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    max_players INTEGER NOT NULL CHECK (max_players IN (6, 9)),
    current_players INTEGER DEFAULT 0,
    min_bet BIGINT NOT NULL,
    max_bet BIGINT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    
    -- Game state
    game_state JSONB, -- Menyimpan state game dalam JSON
    current_dealer_position INTEGER DEFAULT 0,
    current_turn_position INTEGER,
    pot_amount BIGINT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_game_in_progress BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_tables_active (is_active),
    INDEX idx_tables_private (is_private)
);

-- Table: table_players (Pemain di meja)
CREATE TABLE table_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- Posisi di meja (0-8)
    chips_in_play BIGINT NOT NULL,
    is_sitting_out BOOLEAN DEFAULT false,
    is_ready BOOLEAN DEFAULT false,
    
    -- Game state
    current_bet BIGINT DEFAULT 0,
    has_folded BOOLEAN DEFAULT false,
    hole_cards JSONB, -- Kartu hole pemain
    
    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(table_id, user_id),
    UNIQUE(table_id, position),
    CHECK (position >= 0 AND position < 9),
    CHECK (chips_in_play >= 0)
);

-- Table: games (Data game aktif/sudah selesai)
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id),
    
    -- Game info
    game_number INTEGER NOT NULL,
    dealer_position INTEGER NOT NULL,
    small_blind BIGINT NOT NULL,
    big_blind BIGINT NOT NULL,
    
    -- Cards
    community_cards JSONB, -- Kartu community (flop, turn, river)
    deck_state JSONB, -- State deck untuk fairness
    
    -- Pot info
    total_pot BIGINT DEFAULT 0,
    side_pots JSONB, -- Side pots untuk all-in situations
    
    -- Game flow
    current_round VARCHAR(20) DEFAULT 'preflop', -- preflop, flop, turn, river, showdown
    current_player_turn UUID REFERENCES users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    winner_user_id UUID REFERENCES users(id),
    winning_hand JSONB,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_games_table_id (table_id),
    INDEX idx_games_status (status),
    INDEX idx_games_started_at (started_at)
);

-- Table: game_actions (Log aksi dalam game)
CREATE TABLE game_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Action details
    action_type VARCHAR(20) NOT NULL, -- fold, call, raise, check, all_in
    amount BIGINT DEFAULT 0,
    round VARCHAR(20) NOT NULL, -- preflop, flop, turn, river
    position INTEGER NOT NULL,
    
    -- Context
    pot_before_action BIGINT,
    pot_after_action BIGINT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_game_actions_game_id (game_id),
    INDEX idx_game_actions_user_id (user_id)
);

-- Table: transactions (Log top-up via Midtrans)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL, -- purchase, bonus, referral, manual_add, manual_deduct
    amount BIGINT NOT NULL,
    chips_amount BIGINT NOT NULL,
    
    -- Payment info (untuk purchase)
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, cancelled
    midtrans_order_id VARCHAR(100),
    midtrans_transaction_id VARCHAR(100),
    midtrans_response JSONB,
    
    -- Admin info (untuk manual transactions)
    admin_user_id UUID REFERENCES users(id),
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_status (payment_status),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_midtrans_order (midtrans_order_id)
);

-- Table: activity_logs (Semua aktivitas penting)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- login, logout, join_table, leave_table, buy_chips, etc.
    description TEXT,
    metadata JSONB, -- Additional data in JSON format
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    table_id UUID REFERENCES tables(id),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_activity_logs_user_id (user_id),
    INDEX idx_activity_logs_type (activity_type),
    INDEX idx_activity_logs_created_at (created_at),
    INDEX idx_activity_logs_ip (ip_address)
);

-- Table: referrals (Data referral antar pemain)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id),
    referred_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Bonus info
    referrer_bonus BIGINT DEFAULT 1000000, -- Bonus untuk yang mereferral
    referred_bonus BIGINT DEFAULT 500000,  -- Bonus untuk yang direferral
    bonus_claimed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bonus_claimed_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(referred_user_id), -- Satu user hanya bisa direferral sekali
    CHECK (referrer_user_id != referred_user_id)
);

-- Table: ip_logs (Riwayat IP dan lokasi user)
CREATE TABLE ip_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- IP & Location info
    ip_address INET NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    timezone VARCHAR(50),
    isp VARCHAR(200),
    
    -- Device info
    user_agent TEXT,
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- Timestamps
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_count INTEGER DEFAULT 1,
    
    -- Indexes
    INDEX idx_ip_logs_user_id (user_id),
    INDEX idx_ip_logs_ip (ip_address),
    INDEX idx_ip_logs_last_seen (last_seen)
);

-- Table: daily_bonuses (Bonus harian)
CREATE TABLE daily_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Bonus details
    day_streak INTEGER NOT NULL DEFAULT 1,
    bonus_amount BIGINT NOT NULL,
    bonus_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Timestamps
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, bonus_date),
    
    -- Indexes
    INDEX idx_daily_bonuses_user_id (user_id),
    INDEX idx_daily_bonuses_date (bonus_date)
);

-- Table: support_tickets (Sistem tiket bantuan)
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Ticket details
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- technical, payment, account, game, other
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    
    -- Admin response
    admin_user_id UUID REFERENCES users(id),
    admin_response TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_support_tickets_user_id (user_id),
    INDEX idx_support_tickets_status (status),
    INDEX idx_support_tickets_category (category)
);

-- Table: system_settings (Pengaturan sistem)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('daily_bonus_base', '100000', 'Base daily bonus amount'),
('daily_bonus_multiplier', '1.1', 'Daily bonus multiplier for streak'),
('max_daily_bonus_streak', '7', 'Maximum daily bonus streak'),
('referral_bonus_referrer', '1000000', 'Bonus for referrer'),
('referral_bonus_referred', '500000', 'Bonus for referred user'),
('min_chips_to_play', '1000', 'Minimum chips required to join a table'),
('max_tables_per_user', '3', 'Maximum tables a user can join simultaneously'),
('anti_cheat_same_ip_limit', '3', 'Maximum users allowed from same IP'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode');

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chips_wallet_updated_at BEFORE UPDATE ON chips_wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
