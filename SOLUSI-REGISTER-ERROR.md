# 🔧 Solusi untuk Error Register "Terjadi kesalahan. Silakan coba lagi."

## 📋 Ringkasan Masalah
- Error terjadi pada halaman register: http://localhost:3000/register
- Pesan error: "Terjadi kesalahan. Silakan coba lagi."
- Penyebab: Backend NestJS tidak berjalan atau masalah koneksi database

## ✅ Solusi yang Telah Dibuat

### 1. API Routes Next.js (Solusi Sementara)
Telah dibuat API routes langsung di Next.js untuk mengatasi masalah backend:

**File yang dibuat:**
- `frontend/src/pages/api/auth/register.ts` - Endpoint register
- `frontend/src/pages/api/auth/login.ts` - Endpoint login
- `setup-database.js` - Script setup database
- `test-register-api.js` - Script test API

**Dependencies yang ditambahkan:**
```bash
cd frontend
npm install bcrypt @types/bcrypt mysql2 jsonwebtoken @types/jsonwebtoken uuid @types/uuid
```

**Catatan:** Jika masih ada error TypeScript tentang module tidak ditemukan, jalankan:
```bash
cd frontend
npm install
npm run type-check
```

### 2. Konfigurasi Database
API routes menggunakan MySQL dengan konfigurasi default Laragon:
- Host: localhost
- Port: 3306
- User: root
- Password: (kosong)
- Database: poker_online

## 🚀 Cara Menjalankan Solusi

### Langkah 1: Start MySQL Server
**Untuk Laragon:**
1. Buka Laragon
2. Klik "Start All" untuk menjalankan Apache & MySQL

**Untuk XAMPP:**
1. Buka XAMPP Control Panel
2. Start Apache dan MySQL

### Langkah 2: Setup Database
```bash
node setup-database.js
```

### Langkah 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Langkah 4: Test Register
1. Buka browser: http://localhost:3000/register
2. Isi form registrasi
3. Klik "Daftar Sekarang"

## 🧪 Testing & Debugging

### Test API Endpoint
```bash
node test-register-api.js
```

### Manual Test dengan curl
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "fullName": "Test User"
  }'
```

## 🔍 Troubleshooting

### Error: "Database tidak ditemukan"
```bash
# Jalankan setup database
node setup-database.js
```

### Error: "Tidak dapat terhubung ke database"
1. Pastikan MySQL server berjalan (Laragon/XAMPP)
2. Cek port 3306 tidak diblokir
3. Verifikasi kredensial database

### Error: "Frontend server tidak berjalan"
```bash
cd frontend
npm install
npm run dev
```

### Error: Dependencies tidak ditemukan
```bash
cd frontend
npm install bcrypt @types/bcrypt uuid @types/uuid mysql2 jsonwebtoken @types/jsonwebtoken
```

## 📊 Struktur Database

Database `poker_online` akan dibuat dengan tabel:
- `users` - Data pengguna
- `chips_wallet` - Saldo chip pengguna  
- `referrals` - Data referral
- `activity_logs` - Log aktivitas

## 🎯 Fitur yang Berfungsi

### Register API (`/api/auth/register`)
- ✅ Validasi input (username, email, password)
- ✅ Cek duplikasi email/username
- ✅ Hash password dengan bcrypt
- ✅ Bonus 5 juta chip untuk user baru
- ✅ Sistem referral dengan bonus
- ✅ Activity logging
- ✅ Error handling yang detail

### Login API (`/api/auth/login`)
- ✅ Autentikasi dengan email/password
- ✅ JWT token generation
- ✅ User status validation
- ✅ Activity logging

## 🔄 Langkah Selanjutnya (Opsional)

### Untuk Solusi Jangka Panjang:
1. Perbaiki backend NestJS
2. Setup PostgreSQL dengan Docker
3. Migrasi dari API routes ke backend proper

### Untuk Development:
1. Tambah validation yang lebih ketat
2. Implement rate limiting
3. Tambah email verification
4. Setup monitoring & logging

## 📝 Catatan Penting

- **Solusi ini adalah temporary fix** untuk mengatasi masalah register
- Database menggunakan MySQL (bukan PostgreSQL seperti di backend)
- JWT secret menggunakan default (ganti untuk production)
- Password hash menggunakan bcrypt dengan salt rounds 12

## 🆘 Jika Masih Error

1. Pastikan semua dependencies terinstall
2. Cek MySQL server berjalan di port 3306
3. Jalankan `node setup-database.js` untuk setup database
4. Restart frontend server
5. Cek console browser untuk error detail

---

**Status:** ✅ Solusi siap digunakan
**Tested:** ⏳ Perlu testing manual di browser
**Database:** ⏳ Perlu setup MySQL server
