const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function diagnoseDatabaseIssues() {
  console.log('🔍 Mendiagnosis masalah database...\n');
  
  // 1. Cek apakah MySQL service berjalan
  console.log('1️⃣ Mengecek status MySQL service...');
  
  try {
    await new Promise((resolve, reject) => {
      exec('tasklist | findstr -i mysql', (error, stdout, stderr) => {
        if (stdout.trim()) {
          console.log('✅ MySQL process ditemukan:');
          console.log(stdout);
          resolve();
        } else {
          console.log('❌ MySQL process tidak ditemukan');
          reject(new Error('MySQL not running'));
        }
      });
    });
  } catch (error) {
    console.log('⚠️  MySQL server tidak berjalan');
    
    // Coba start MySQL service
    console.log('\n2️⃣ Mencoba menjalankan MySQL service...');
    
    const services = ['mysql', 'mysql80', 'mysql57', 'mariadb'];
    let serviceStarted = false;
    
    for (const serviceName of services) {
      try {
        await new Promise((resolve, reject) => {
          exec(`net start ${serviceName}`, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              console.log(`✅ Service ${serviceName} berhasil dijalankan`);
              serviceStarted = true;
              resolve();
            }
          });
        });
        break;
      } catch (err) {
        console.log(`❌ Gagal menjalankan service ${serviceName}`);
      }
    }
    
    if (!serviceStarted) {
      console.log('\n💡 Solusi manual:');
      console.log('1. Buka Laragon Control Panel');
      console.log('2. Klik tombol "Start All" atau "Start" pada MySQL');
      console.log('3. Atau buka XAMPP Control Panel dan start MySQL');
      console.log('4. Tunggu hingga status MySQL menjadi "Running"');
      console.log('5. Jalankan script ini lagi setelah MySQL aktif\n');
      
      return false;
    }
  }
  
  // 2. Test koneksi database
  console.log('\n3️⃣ Testing koneksi database...');
  
  const connectionConfigs = [
    { host: 'localhost', port: 3306, user: 'root', password: '' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '' },
    { host: 'localhost', port: 3306, user: 'root', password: 'root' },
    { host: 'localhost', port: 3307, user: 'root', password: '' },
  ];
  
  let workingConfig = null;
  
  for (const config of connectionConfigs) {
    try {
      console.log(`Testing: ${config.host}:${config.port} user=${config.user} pass=${config.password || '(empty)'}`);
      
      const connection = await mysql.createConnection(config);
      await connection.execute('SELECT 1');
      await connection.end();
      
      console.log('✅ Koneksi berhasil!');
      workingConfig = config;
      break;
    } catch (error) {
      console.log(`❌ Gagal: ${error.message}`);
    }
  }
  
  if (!workingConfig) {
    console.log('\n❌ Tidak dapat terhubung ke MySQL dengan konfigurasi apapun');
    console.log('\n💡 Troubleshooting:');
    console.log('1. Pastikan MySQL server berjalan');
    console.log('2. Cek port MySQL (default: 3306)');
    console.log('3. Cek username/password MySQL');
    console.log('4. Restart MySQL service');
    console.log('5. Cek firewall settings');
    return false;
  }
  
  // 3. Setup database dengan konfigurasi yang bekerja
  console.log('\n4️⃣ Setting up database dengan konfigurasi yang bekerja...');
  
  try {
    const connection = await mysql.createConnection(workingConfig);
    
    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS poker_online');
    console.log('✅ Database "poker_online" created/verified');
    
    await connection.end();
    
    // Connect to specific database
    const dbConfig = { ...workingConfig, database: 'poker_online' };
    const dbConnection = await mysql.createConnection(dbConfig);
    
    // Create tables
    const createTables = `
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (referred_by) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS referral_bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id VARCHAR(36) NOT NULL,
        referred_id VARCHAR(36) NOT NULL,
        bonus_amount BIGINT DEFAULT 1000000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(id),
        FOREIGN KEY (referred_id) REFERENCES users(id)
      );
    `;
    
    const statements = createTables.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dbConnection.execute(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn('Warning:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Database tables created successfully');
    
    // Test tables
    const [tables] = await dbConnection.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    tables.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });
    
    await dbConnection.end();
    
    // 4. Update environment file
    console.log('\n5️⃣ Updating environment configuration...');
    
    const envContent = `
# Database Configuration
DB_HOST=${workingConfig.host}
DB_PORT=${workingConfig.port}
DB_USER=${workingConfig.user}
DB_PASSWORD=${workingConfig.password}
DB_NAME=poker_online

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production_${Date.now()}

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
`;
    
    const envPath = path.join(__dirname, 'frontend', '.env.local');
    fs.writeFileSync(envPath, envContent.trim());
    console.log('✅ Environment file updated');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Konfigurasi yang bekerja:');
    console.log(`   Host: ${workingConfig.host}`);
    console.log(`   Port: ${workingConfig.port}`);
    console.log(`   User: ${workingConfig.user}`);
    console.log(`   Password: ${workingConfig.password || '(empty)'}`);
    console.log(`   Database: poker_online`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

// Test API endpoint
async function testRegisterAPI() {
  console.log('\n6️⃣ Testing register API endpoint...');
  
  try {
    const testData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Test User'
    };
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Register API test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Register API test failed');
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.log('❌ Cannot test API - server might not be running');
    console.log('Error:', error.message);
  }
}

async function main() {
  console.log('🚀 Database Diagnosis and Fix Tool');
  console.log('=====================================\n');
  
  const dbSetupSuccess = await diagnoseDatabaseIssues();
  
  if (dbSetupSuccess) {
    console.log('\n✅ Database setup berhasil!');
    console.log('\n📋 Langkah selanjutnya:');
    console.log('1. Jalankan frontend server: cd frontend && npm run dev');
    console.log('2. Buka browser: http://localhost:3000/register');
    console.log('3. Test registrasi dengan data dummy');
    
    // Test API if server is running
    setTimeout(testRegisterAPI, 2000);
  } else {
    console.log('\n❌ Database setup gagal');
    console.log('Silakan ikuti instruksi troubleshooting di atas');
  }
}

main().catch(console.error);
