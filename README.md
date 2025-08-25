# 🃏 Poker Online Gratis - Texas Hold'em

Website poker online gratis berbasis web yang memungkinkan siapa pun bermain poker Texas Hold'em secara gratis dengan chip virtual, sistem top-up, bonus harian, sistem anti-cheat, dan panel admin profesional.

## 🚀 Fitur Utama

### 👥 Fitur Pemain (User Side)
- ✅ **Registrasi & Login** - Email, Google, Facebook OAuth, CAPTCHA
- 💰 **Bonus Awal** - 5.000.000 chip saat registrasi
- 🎮 **Lobby Game** - Daftar meja poker: 6/9 pemain per meja, private/public
- ♠️ **Sistem Game** - Texas Hold'em klasik, dengan dealer otomatis
- 👤 **Profil Pemain** - Avatar, nama pengguna, histori permainan, statistik
- 💳 **Top-Up Chip** - Sistem pembayaran terintegrasi Midtrans (QRIS, e-Wallet, dll)
- 🎁 **Daily Bonus** - Bonus login harian progresif
- 🔗 **Referral System** - Kode referral = bonus chip
- 🏆 **Leaderboard** - Harian, mingguan, global
- 📊 **History Game** - Riwayat kartu, posisi, menang/kalah
- 💬 **Chat Dalam Game** - Chat publik dan emoji
- 🌍 **Deteksi Lokasi/IP** - Deteksi pemain yang bermain di lokasi/IP sama
- 🆘 **Bantuan/Support** - Sistem tiket bantuan pengguna

### 🛠️ Fitur Admin Panel
- 📈 **Dashboard Utama** - Statistik pemain aktif, transaksi, jumlah meja, total chip
- 👥 **Manajemen Pemain** - Lihat, cari, suspend/ban user, reset password, kirim chip manual
- 💰 **Tambah Chip Manual** - Input user ID + jumlah chip
- 🌐 **IP & Lokasi Tracker** - Lihat riwayat login + IP + lokasi user
- 📝 **Log Aktivitas Pemain** - Semua tindakan (login, beli chip, join game, menang/kalah)
- 🎲 **Manajemen Meja** - Lihat semua meja aktif, kick pemain, delete meja
- 💎 **Manajemen Chip** - Daftar top-up, refund, mutasi chip per user
- 🎉 **Manajemen Event & Bonus** - Atur bonus harian, event referral, kode voucher
- 📢 **Notifikasi & Pesan Sistem** - Broadcast pengumuman di lobby
- 📊 **Analitik Real-Time** - Jumlah chip beredar, rasio aktif user, win rate abnormal
- 💳 **Integrasi Midtrans** - Monitoring pembayaran dan callback webhook otomatis

## 🏗️ Arsitektur Sistem

```
[Client] <--> [Frontend (Next.js/React)] <--> [Backend API (Node.js/NestJS)]
                                           <--> [Database (PostgreSQL)]
                                           <--> [Game Engine (WebSocket/Socket.IO)]
                                           <--> [Admin Panel (Separate React App)]
                                           <--> [IP Location API (ipdata.co)]
                                           <--> [Payment Gateway (Midtrans Snap API)]
```

## 📁 Struktur Proyek

```
gamepoker/
├── backend/                 # Backend API (NestJS)
│   ├── src/
│   │   ├── auth/           # JWT Auth & Guard
│   │   ├── users/          # User CRUD & profile
│   │   ├── game/           # Game logic, tables, dealers
│   │   ├── chip/           # Chip wallet, transaction logs
│   │   ├── payments/       # Midtrans integration
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── analytics/      # IP tracker, logs, stats
│   │   └── events/         # Daily bonus, promotions
│   ├── package.json
│   └── .env.example
├── frontend/               # Frontend (Next.js/React)
│   ├── src/
│   │   ├── pages/          # Next.js pages
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env.local.example
├── database/               # Database schema & migrations
│   └── schema.sql
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Authentication**: JWT, Passport (Google/Facebook OAuth)
- **Real-time**: Socket.IO
- **Payment**: Midtrans API
- **Validation**: Class Validator
- **Documentation**: Swagger

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Forms**: React Hook Form + Yup
- **Real-time**: Socket.IO Client
- **Authentication**: NextAuth.js
- **UI Components**: Custom components with Framer Motion

### Database
- **Primary**: PostgreSQL
- **Features**: UUID, JSONB, Triggers, Indexes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd gamepoker
```

### 2. Setup Database
```bash
# Buat database PostgreSQL
createdb poker_online

# Import schema
psql -d poker_online -f database/schema.sql
```

### 3. Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
# DATABASE_HOST, DATABASE_PASSWORD, JWT_SECRET, dll.

# Jalankan development server
npm run start:dev
```

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local dengan konfigurasi Anda
# NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, dll.

# Jalankan development server
npm run dev
```

### 5. Akses Aplikasi
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## 🔧 Konfigurasi

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=poker_online

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Midtrans
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
```

#### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Midtrans
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```

## 🔒 Keamanan & Fair Play

- **JWT Authentication** - Token validasi aman di sisi klien
- **Rate Limiting & CAPTCHA** - Mencegah spam & abuse
- **IP & Geo-Location Detection** - Deteksi multi-akun dengan IP sama
- **WebSocket Monitoring** - Menangkal auto-play bot
- **Anti-Cheat** - Deteksi user yang bermain terlalu sering dengan user sama
- **Server-Side Card Dealing** - Agar fair & tidak bisa dimanipulasi

## 💳 Integrasi Pembayaran

### Midtrans Integration
- **Snap Checkout** - Pengguna memilih nominal, dibayar via e-wallet/QRIS/bank
- **Webhook Callback** - Update otomatis jika pembayaran sukses
- **Invoice History** - Bisa dicek di profil pengguna dan admin panel
- **Retry Payment** - Untuk transaksi yang gagal

## 📊 Database Schema

### Tabel Utama
- `users` - Data akun pengguna
- `chips_wallet` - Saldo chip tiap user
- `tables` - Info meja & pemain
- `games` - Data game aktif/sudah selesai
- `transactions` - Log top-up via Midtrans
- `activity_logs` - Semua aktivitas penting
- `referrals` - Data referral antar pemain
- `ip_logs` - Riwayat IP dan lokasi user

## 🧪 Testing

```bash
# Backend testing
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend testing
cd frontend
npm run test
npm run test:watch
```

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

### Docker (Optional)
```bash
# Build dan jalankan dengan Docker Compose
docker-compose up -d
```

## 📝 API Documentation

Setelah menjalankan backend, akses dokumentasi API di:
http://localhost:3001/api/docs

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Buka issue di GitHub repository
2. Email: support@pokeronline.com
3. Discord: [Join our server](https://discord.gg/poker)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Tournament system
- [ ] Multi-language support
- [ ] Voice chat integration
- [ ] Advanced analytics dashboard
- [ ] Blockchain integration for transparency

---

**Dibuat dengan ❤️ untuk komunitas poker Indonesia**
