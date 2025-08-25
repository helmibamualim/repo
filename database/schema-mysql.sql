-- Database Schema untuk Website Poker Online Gratis - Texas Hold'em
-- MySQL Database (Converted from PostgreSQL)

-- Set SQL mode and charset
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Set charset
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Table: users (Data akun pengguna)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
    total_games_played INT DEFAULT 0,
    total_games_won INT DEFAULT 0,
    total_chips_won BIGINT DEFAULT 0,
    total_chips_lost BIGINT DEFAULT 0,
    
    -- Account status
    is_active TINYINT(1) DEFAULT 1,
    is_banned TINYINT(1) DEFAULT 0,
    ban_reason TEXT,
    ban_until TIMESTAMP NULL,
    
    -- Referral
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(36),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (referred_by) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_referral_code (referral_code)
);

-- Table: chips_wallet (Saldo chip tiap user)
CREATE TABLE chips_wallet (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    balance BIGINT DEFAULT 5000000, -- Bonus awal 5 juta chip
    total_purchased BIGINT DEFAULT 0,
    total_bonus_received BIGINT DEFAULT 5000000, -- Bonus awal
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (balance >= 0)
);

-- Table: tables (Info meja & pemain)
CREATE TABLE tables (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    max_players INT NOT NULL,
    current_players INT DEFAULT 0,
    min_bet BIGINT NOT NULL,
    max_bet BIGINT NOT NULL,
    is_private TINYINT(1) DEFAULT 0,
    password_hash VARCHAR(255),
    
    -- Game state
    game_state JSON, -- Menyimpan state game dalam JSON
    current_dealer_position INT DEFAULT 0,
    current_turn_position INT,
    pot_amount BIGINT DEFAULT 0,
    
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    is_game_in_progress TINYINT(1) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (max_players IN (6, 9)),
    
    -- Indexes
    INDEX idx_tables_active (is_active),
    INDEX idx_tables_private (is_private)
);

-- Table: table_players (Pemain di meja)
CREATE TABLE table_players (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    table_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    position INT NOT NULL, -- Posisi di meja (0-8)
    chips_in_play BIGINT NOT NULL,
    is_sitting_out TINYINT(1) DEFAULT 0,
    is_ready TINYINT(1) DEFAULT 0,
    
    -- Game state
    current_bet BIGINT DEFAULT 0,
    has_folded TINYINT(1) DEFAULT 0,
    hole_cards JSON, -- Kartu hole pemain
    
    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(table_id, user_id),
    UNIQUE(table_id, position),
    CHECK (position >= 0 AND position < 9),
    CHECK (chips_in_play >= 0),
    
    -- Foreign Keys
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: games (Data game aktif/sudah selesai)
CREATE TABLE games (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    table_id VARCHAR(36) NOT NULL,
    
    -- Game info
    game_number INT NOT NULL,
    dealer_position INT NOT NULL,
    small_blind BIGINT NOT NULL,
    big_blind BIGINT NOT NULL,
    
    -- Cards
    community_cards JSON, -- Kartu community (flop, turn, river)
    deck_state JSON, -- State deck untuk fairness
    
    -- Pot info
    total_pot BIGINT DEFAULT 0,
    side_pots JSON, -- Side pots untuk all-in situations
    
    -- Game flow
    current_round VARCHAR(20) DEFAULT 'preflop', -- preflop, flop, turn, river, showdown
    current_player_turn VARCHAR(36),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    winner_user_id VARCHAR(36),
    winning_hand JSON,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (current_player_turn) REFERENCES users(id),
    FOREIGN KEY (winner_user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_games_table_id (table_id),
    INDEX idx_games_status (status),
    INDEX idx_games_started_at (started_at)
);

-- Table: game_actions (Log aksi dalam game)
CREATE TABLE game_actions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    game_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    
    -- Action details
    action_type VARCHAR(20) NOT NULL, -- fold, call, raise, check, all_in
    amount BIGINT DEFAULT 0,
    round VARCHAR(20) NOT NULL, -- preflop, flop, turn, river
    position INT NOT NULL,
    
    -- Context
    pot_before_action BIGINT,
    pot_after_action BIGINT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_game_actions_game_id (game_id),
    INDEX idx_game_actions_user_id (user_id)
);

-- Table: transactions (Log top-up via Midtrans)
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL, -- purchase, bonus, referral, manual_add, manual_deduct
    amount BIGINT NOT NULL,
    chips_amount BIGINT NOT NULL,
    
    -- Payment info (untuk purchase)
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, cancelled
    midtrans_order_id VARCHAR(100),
    midtrans_transaction_id VARCHAR(100),
    midtrans_response JSON,
    
    -- Admin info (untuk manual transactions)
    admin_user_id VARCHAR(36),
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_status (payment_status),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_midtrans_order (midtrans_order_id)
);

-- Table: activity_logs (Semua aktivitas penting)
CREATE TABLE activity_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- login, logout, join_table, leave_table, buy_chips, etc.
    description TEXT,
    metadata JSON, -- Additional data in JSON format
    
    -- Context
    ip_address VARCHAR(45), -- Support IPv4 and IPv6
    user_agent TEXT,
    table_id VARCHAR(36),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (table_id) REFERENCES tables(id),
    
    -- Indexes
    INDEX idx_activity_logs_user_id (user_id),
    INDEX idx_activity_logs_type (activity_type),
    INDEX idx_activity_logs_created_at (created_at),
    INDEX idx_activity_logs_ip (ip_address)
);

-- Table: referrals (Data referral antar pemain)
CREATE TABLE referrals (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    referrer_user_id VARCHAR(36) NOT NULL,
    referred_user_id VARCHAR(36) NOT NULL,
    
    -- Bonus info
    referrer_bonus BIGINT DEFAULT 1000000, -- Bonus untuk yang mereferral
    referred_bonus BIGINT DEFAULT 500000,  -- Bonus untuk yang direferral
    bonus_claimed TINYINT(1) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bonus_claimed_at TIMESTAMP NULL,
    
    -- Constraints
    UNIQUE(referred_user_id), -- Satu user hanya bisa direferral sekali
    CHECK (referrer_user_id != referred_user_id),
    
    -- Foreign Keys
    FOREIGN KEY (referrer_user_id) REFERENCES users(id),
    FOREIGN KEY (referred_user_id) REFERENCES users(id)
);

-- Table: ip_logs (Riwayat IP dan lokasi user)
CREATE TABLE ip_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- IP & Location info
    ip_address VARCHAR(45) NOT NULL, -- Support IPv4 and IPv6
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
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    login_count INT DEFAULT 1,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_ip_logs_user_id (user_id),
    INDEX idx_ip_logs_ip (ip_address),
    INDEX idx_ip_logs_last_seen (last_seen)
);

-- Table: daily_bonuses (Bonus harian)
CREATE TABLE daily_bonuses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Bonus details
    day_streak INT NOT NULL DEFAULT 1,
    bonus_amount BIGINT NOT NULL,
    bonus_date DATE NOT NULL DEFAULT (CURDATE()),
    
    -- Timestamps
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, bonus_date),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_daily_bonuses_user_id (user_id),
    INDEX idx_daily_bonuses_date (bonus_date)
);

-- Table: support_tickets (Sistem tiket bantuan)
CREATE TABLE support_tickets (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Ticket details
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- technical, payment, account, game, other
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    
    -- Admin response
    admin_user_id VARCHAR(36),
    admin_response TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_user_id) REFERENCES users(id),
    
    -- Indexes
    INDEX idx_support_tickets_user_id (user_id),
    INDEX idx_support_tickets_status (status),
    INDEX idx_support_tickets_category (category)
);

-- Table: system_settings (Pengaturan sistem)
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

-- Commit transaction
COMMIT;

-- Restore SQL settings
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
