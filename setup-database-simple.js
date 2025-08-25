const mysql = require('mysql2/promise');

async function setupDatabase() {
  console.log('🔧 SETUP DATABASE POKER ONLINE');
  console.log('==============================\n');
  
  try {
    console.log('1️⃣ Connecting to MySQL server...');
    
    // Connect to MySQL server
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '', // Default Laragon/XAMPP
      connectTimeout: 10000
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS poker_online');
    console.log('✅ Database "poker_online" created');
    
    await connection.end();
    
    console.log('\n2️⃣ Setting up tables...');
    
    // Connect to poker_online database
    const dbConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'poker_online'
    });
    
    // Create users table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        chips BIGINT DEFAULT 5000000,
        referral_code VARCHAR(20) UNIQUE,
        referred_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create activity_logs table
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables created successfully');
    
    // Show tables
    const [tables] = await dbConnection.execute('SHOW TABLES');
    console.log('\n📋 Tables in database:');
    tables.forEach(row => {
      console.log(`   - ${Object.values(row)[0]}`);
    });
    
    await dbConnection.end();
    
    console.log('\n🎉 DATABASE SETUP COMPLETED!');
    console.log('\n📝 Next steps:');
    console.log('1. cd frontend');
    console.log('2. npm run dev');
    console.log('3. Open: http://localhost:3000/register');
    
  } catch (error) {
    console.error('\n❌ DATABASE SETUP FAILED!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 MYSQL SERVER NOT RUNNING!');
      console.log('Solution:');
      console.log('1. Open Laragon Control Panel');
      console.log('2. Click "Start All" or start MySQL');
      console.log('3. Wait until MySQL status is "Running"');
      console.log('4. Run this script again');
    }
    
    process.exit(1);
  }
}

setupDatabase();
