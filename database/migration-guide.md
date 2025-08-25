# Panduan Migrasi Database: PostgreSQL ke MySQL

## Masalah yang Diperbaiki

File `schema.sql` asli menggunakan syntax PostgreSQL yang tidak kompatibel dengan MySQL. Error yang muncul:
```
#1064 - You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'EXTENSION IF NOT EXISTS "uuid-ossp"' at line 5
```

## Perubahan yang Dilakukan

### 1. Tipe Data
| PostgreSQL | MySQL | Keterangan |
|------------|-------|------------|
| `UUID` | `VARCHAR(36)` | UUID disimpan sebagai string 36 karakter |
| `JSONB` | `JSON` | MySQL menggunakan JSON native |
| `INET` | `VARCHAR(45)` | Untuk menyimpan IPv4/IPv6 |
| `BOOLEAN` | `TINYINT(1)` | MySQL standard untuk boolean |
| `INTEGER` | `INT` | Alias yang lebih umum |

### 2. Functions & Extensions
- **Dihapus**: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
- **Diganti**: `uuid_generate_v4()` → `UUID()` (MySQL 8.0+)
- **Diganti**: `CURRENT_DATE` → `CURDATE()`
- **Diganti**: `CURRENT_TIMESTAMP` → `CURRENT_TIMESTAMP` (sama, tapi dengan ON UPDATE)

### 3. Syntax Perbaikan
- **INDEX**: Dipindahkan FOREIGN KEY ke bagian terpisah
- **CHECK Constraints**: Disesuaikan dengan MySQL syntax
- **Triggers**: Dihapus karena MySQL menggunakan `ON UPDATE CURRENT_TIMESTAMP`
- **AUTO UPDATE**: Menggunakan `ON UPDATE CURRENT_TIMESTAMP` untuk kolom `updated_at`

## Cara Menggunakan

### Langkah 1: Backup Database (Opsional)
Jika sudah ada data, backup terlebih dahulu:
```sql
mysqldump -u username -p database_name > backup.sql
```

### Langkah 2: Import Schema MySQL
1. Buka phpMyAdmin
2. Pilih database `poker_online` 
3. Klik tab **Import**
4. Pilih file `database/schema-mysql.sql`
5. Klik **Go**

### Langkah 3: Verifikasi Import
Setelah import berhasil, pastikan semua tabel terbuat:
```sql
SHOW TABLES;
```

Anda harus melihat 13 tabel:
- users
- chips_wallet  
- tables
- table_players
- games
- game_actions
- transactions
- activity_logs
- referrals
- ip_logs
- daily_bonuses
- support_tickets
- system_settings

### Langkah 4: Test Koneksi Backend
Pastikan backend bisa connect ke database MySQL dengan menjalankan:
```bash
cd backend
npm run start:dev
```

## Perbedaan Penting untuk Developer

### 1. UUID Handling
**PostgreSQL (Lama):**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

**MySQL (Baru):**
```sql
id VARCHAR(36) PRIMARY KEY DEFAULT (UUID())
```

**Di Backend Code:**
- UUID tetap bisa digunakan sebagai string
- Pastikan validation menerima format UUID string

### 2. JSON Fields
**PostgreSQL (Lama):**
```sql
game_state JSONB
```

**MySQL (Baru):**
```sql
game_state JSON
```

**Di Backend Code:**
- JSON handling tetap sama
- MySQL JSON mendukung indexing dan query

### 3. Boolean Fields
**PostgreSQL (Lama):**
```sql
is_active BOOLEAN DEFAULT true
```

**MySQL (Baru):**
```sql
is_active TINYINT(1) DEFAULT 1
```

**Di Backend Code:**
- Gunakan `true/false` atau `1/0`
- ORM akan handle konversi otomatis

## Troubleshooting

### Error: "Unknown function UUID()"
Jika mendapat error ini, berarti MySQL versi < 8.0. Solusi:
1. Update MySQL ke versi 8.0+, atau
2. Hapus `DEFAULT (UUID())` dan generate UUID di aplikasi

### Error: "JSON column cannot have a default value"
Jika ada error pada kolom JSON, ubah:
```sql
-- Dari:
game_state JSON DEFAULT NULL

-- Ke:
game_state JSON
```

### Error: Foreign Key Constraint
Pastikan urutan pembuatan tabel benar. Tabel yang direferensi harus dibuat dulu.

## File yang Digunakan

- **File Lama**: `database/schema.sql` (PostgreSQL) - Jangan digunakan untuk MySQL
- **File Baru**: `database/schema-mysql.sql` (MySQL) - Gunakan file ini
- **Panduan**: `database/migration-guide.md` (file ini)

## Catatan Penting

1. **Backup Data**: Selalu backup data sebelum migrasi
2. **Test Environment**: Test di development environment dulu
3. **Version Control**: Commit perubahan sebelum migrasi
4. **Backend Config**: Pastikan backend menggunakan MySQL driver, bukan PostgreSQL

## Kontak Support

Jika ada masalah saat migrasi, periksa:
1. Versi MySQL (minimal 5.7, recommended 8.0+)
2. Privileges user database
3. Charset database (gunakan utf8mb4)
4. Log error MySQL untuk detail masalah
