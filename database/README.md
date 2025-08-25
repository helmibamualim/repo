# Database Setup - Poker Online Game

## 📁 File Structure
```
database/
├── schema.sql              # ❌ PostgreSQL (JANGAN DIGUNAKAN untuk MySQL)
├── schema-mysql.sql        # ✅ MySQL (GUNAKAN FILE INI)
├── migration-guide.md      # 📖 Panduan lengkap migrasi
└── README.md              # 📄 File ini
```

## 🚀 Quick Start

### 1. Import Database Schema
1. Buka **phpMyAdmin** di browser: `http://localhost/phpmyadmin`
2. Login dengan kredensial MySQL Anda
3. Buat database baru bernama `poker_online` (jika belum ada)
4. Pilih database `poker_online`
5. Klik tab **Import**
6. Pilih file `database/schema-mysql.sql`
7. Klik **Go**

### 2. Verifikasi Import Berhasil
Setelah import, Anda harus melihat **13 tabel** terbuat:
- ✅ users
- ✅ chips_wallet
- ✅ tables
- ✅ table_players
- ✅ games
- ✅ game_actions
- ✅ transactions
- ✅ activity_logs
- ✅ referrals
- ✅ ip_logs
- ✅ daily_bonuses
- ✅ support_tickets
- ✅ system_settings

## ⚠️ Penting!

### Jangan Gunakan File `schema.sql`
File `schema.sql` menggunakan syntax **PostgreSQL** dan akan menyebabkan error jika diimport ke MySQL:
```
#1064 - You have an error in your SQL syntax
```

### Gunakan File `schema-mysql.sql`
File ini sudah dikonversi khusus untuk **MySQL** dan kompatibel dengan phpMyAdmin.

## 🔧 Konfigurasi Backend

Pastikan file konfigurasi backend menggunakan MySQL:

**File: `backend/src/app.module.ts`**
```typescript
TypeOrmModule.forRoot({
  type: 'mysql',           // ✅ Gunakan mysql
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',            // Sesuaikan dengan password MySQL Anda
  database: 'poker_online',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,      // ✅ Set false karena sudah ada schema
}),
```

## 🐛 Troubleshooting

### Error: "Unknown function UUID()"
**Solusi**: Update MySQL ke versi 8.0+ atau hapus `DEFAULT (UUID())` dari schema.

### Error: "Table already exists"
**Solusi**: Drop database dan buat ulang, atau gunakan `DROP TABLE IF EXISTS` sebelum import.

### Error: "Access denied"
**Solusi**: Pastikan user MySQL memiliki privileges untuk CREATE, INSERT, ALTER.

## 📊 Database Schema Overview

### Core Tables
- **users**: Data akun pengguna dan statistik
- **chips_wallet**: Saldo chip setiap user
- **tables**: Info meja poker
- **games**: Data game yang sedang/sudah berlangsung

### Game Logic Tables
- **table_players**: Pemain yang sedang di meja
- **game_actions**: Log semua aksi dalam game (fold, call, raise, dll)

### Business Tables
- **transactions**: Log pembelian chip via Midtrans
- **referrals**: Sistem referral antar pemain
- **daily_bonuses**: Bonus harian user

### System Tables
- **activity_logs**: Log semua aktivitas penting
- **ip_logs**: Tracking IP dan device user
- **support_tickets**: Sistem tiket bantuan
- **system_settings**: Konfigurasi sistem

## 🎯 Default Data

Schema sudah include data default untuk `system_settings`:
- Daily bonus: 100,000 chips
- Referral bonus: 1,000,000 chips (referrer), 500,000 chips (referred)
- Minimum chips to play: 1,000 chips
- Dan lainnya...

## 📞 Butuh Bantuan?

1. **Baca panduan lengkap**: `database/migration-guide.md`
2. **Cek log error**: Lihat error MySQL di phpMyAdmin atau log file
3. **Verifikasi versi**: Pastikan MySQL versi 5.7+ (recommended 8.0+)
4. **Test koneksi**: Jalankan `npm run start:dev` di folder backend
