# 🔧 PANDUAN PERBAIKAN DATABASE POKER ONLINE

## ❌ MASALAH
Error "tidak dapat terhubung dengan database" pada http://localhost:3000/register

## ✅ SOLUSI LENGKAP

### LANGKAH 1: START MYSQL SERVER
1. **Buka Laragon Control Panel** (atau XAMPP)
2. **Klik tombol "Start All"** atau klik "Start" pada MySQL
3. **Tunggu hingga status MySQL menjadi "Running" (hijau)**
4. **Jangan tutup Laragon** - biarkan tetap berjalan

### LANGKAH 2: SETUP DATABASE
Jalankan perintah ini di terminal:
```bash
node setup-database-simple.js
```

### LANGKAH 3: START FRONTEND SERVER
```bash
cd frontend
npm run dev
```

### LANGKAH 4: TEST REGISTRASI
1. Buka browser: http://localhost:3000/register
2. Isi form registrasi dengan data test
3. Klik "Daftar Sekarang"

---

## 🚨 JIKA MASIH ERROR

### Cek 1: MySQL Berjalan?
```bash
netstat -ano | findstr :3306
```
Harus ada output yang menunjukkan port 3306 aktif.

### Cek 2: Test Koneksi Database
```bash
node test-db-connection.js
```

### Cek 3: Restart Semua
1. Tutup Laragon
2. Restart Laragon
3. Start All services
4. Jalankan setup database lagi

---

## 📋 TROUBLESHOOTING

### Error: ECONNREFUSED
- MySQL server tidak berjalan
- Start MySQL di Laragon/XAMPP

### Error: ER_ACCESS_DENIED_ERROR
- Username/password salah
- Default: user=root, password=(kosong)

### Error: Port 3306 in use
- Ada aplikasi lain menggunakan port 3306
- Restart komputer atau kill process

---

## 🎯 HASIL AKHIR
Setelah berhasil:
- ✅ MySQL server running
- ✅ Database poker_online terbuat
- ✅ Frontend server running di port 3000
- ✅ Registrasi berfungsi normal
- ✅ User mendapat 5 juta chip bonus
