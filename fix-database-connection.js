const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

console.log('🔧 PERBAIKAN DATABASE CONNECTION');
console.log('================================\n');

async function fixDatabaseConnection() {
  console.log('1️⃣ Mengecek koneksi database...\n');
  
  // Test berbagai konfigurasi database yang umum
  const configs = [
    { host: 'localhost', port: 3306, user: 'root', password: '', name: 'Default Laragon/XAMPP' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '', name: 'Localhost IP' },
    { host: 'localhost', port: 3306, user: 'root', password: 'root', name: 'Password: root' },
    { host: 'localhost', port: 3307, user: 'root', password: '', name: 'Port 3307' },
  ];
  
  let workingConfig = null;
  
  for (const config of configs) {
    try {
      console.log(`Testing ${config.name}: ${config.host}:${config.port}`);
      
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        connectTimeout: 5000
      });
      
      await connection.execute('SELECT 1 as test');
      await connection.end();
      
      console.log('✅ BERHASIL TERHUBUNG!\n');
      workingConfig = config;
      break;
      
    } catch (error) {
      console.log(`❌ Gagal: ${error.code || error.message}`);
    }
  }
  
  if (!workingConfig) {
    console.log('\n❌ TIDAK DAPAT TERHUBUNG KE DATABASE');
    console.log('\n🚨 SOLUSI YANG HARUS DILAKUKAN:');
    console.log('1. BUKA LARAGON CONTROL PANEL');
    console.log('2. KLIK TOMBOL "START ALL" ATAU START MYSQL');
    console.log('3. TUNGGU HINGGA MYSQL STATUS MENJADI "RUNNING"');
    console.log('4. ATAU BUKA XAMPP DAN START MYSQL');
    console.log('5. JALANKAN SCRIPT INI LAGI SETELAH MYSQL AKTIF');
    console.log('\n💡 Jika masih gagal, coba:');
    console.log('   - Restart Laragon/XAMPP');
    console.log('   - Cek port 3306 tidak digunakan aplikasi lain');
    console.log('   - Reinstall MySQL service');
    return false;
  }
  
  console.log('2️⃣ Setup database poker_online...\n');
  
  try {
    // Connect dan buat database
    const connection = await mysql.createConnection(workingConfig);
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS poker_online');
    console.log('✅ Database "poker_online" berhasil dibuat/diverifikasi');
    
    await connection.end();
    
    // Connect ke database poker_online
    const dbConnection = await mysql.createConnection({
      ...workingConfig,
      database: 'poker_online'
    });
    
    // Buat tabel users
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        avatar_url VARCHAR(255),
        chips BIGINT DEFAULT 5000000,
        total_games INT DEFAULT 0,
        games_won INT DEFAULT 0,
        referral_code VARCHAR(20) UNIQUE,
        referred_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Buat tabel activity_logs
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabel database berhasil dibuat');
    
    // Cek tabel yang ada
    const [tables] = await dbConnection.execute('SHOW TABLES');
    console.log('\n📋 Tabel yang tersedia:');
    tables.forEach(row => {
      console.log(`   - ${Object.values(row)[0]}`);
    });
    
    await dbConnection.end();
    
    console.log('\n3️⃣ Update konfigurasi environment...\n');
    
    // Buat/update file .env.local
    const envContent = `# Database Configuration - WORKING CONFIG
DB_HOST=${workingConfig.host}
DB_PORT=${workingConfig.port}
DB_USER=${workingConfig.user}
DB_PASSWORD=${workingConfig.password}
DB_NAME=poker_online

# JWT Secret
JWT_SECRET=poker_secret_key_${Date.now()}

# App Config
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
`;
    
    const envPath = path.join(__dirname, 'frontend', '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ File .env.local berhasil diupdate');
    
    console.log('\n🎉 DATABASE CONNECTION BERHASIL DIPERBAIKI!');
    console.log('\n📝 Konfigurasi yang bekerja:');
    console.log(`   Host: ${workingConfig.host}`);
    console.log(`   Port: ${workingConfig.port}`);
    console.log(`   User: ${workingConfig.user}`);
    console.log(`   Password: ${workingConfig.password || '(kosong)'}`);
    console.log(`   Database: poker_online`);
    
    console.log('\n🚀 LANGKAH SELANJUTNYA:');
    console.log('1. Jalankan: cd frontend && npm run dev');
    console.log('2. Buka browser: http://localhost:3000/register');
    console.log('3. Test registrasi - seharusnya sudah berfungsi!');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error saat setup database:', error.message);
    console.log('\n💡 Coba restart MySQL service dan jalankan script ini lagi');
    return false;
  }
}

// Jalankan perbaikan
fixDatabaseConnection().catch(error => {
  console.error('\n❌ SCRIPT ERROR:', error.message);
  console.log('\n🚨 PASTIKAN:');
  console.log('1. MySQL server berjalan (Laragon/XAMPP)');
  console.log('2. Port 3306 tidak diblokir');
  console.log('3. npm install sudah dijalankan');
});
