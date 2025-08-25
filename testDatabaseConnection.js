const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing MySQL connection...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '', // Default XAMPP/Laragon password
      database: 'poker_online'
    });

    console.log('✅ Connected to MySQL successfully!');
    
    // Test query
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('📋 Tables in database:');
    rows.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });
    
    // Test users table structure
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('\n👤 Users table structure:');
    userColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    await connection.end();
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Suggestions:');
      console.log('  - Check MySQL username/password');
      console.log('  - Make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Suggestions:');
      console.log('  - Create database "poker_online" first');
      console.log('  - Import schema-mysql.sql');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('  - Start MySQL server (XAMPP/Laragon)');
      console.log('  - Check if port 3306 is correct');
    }
  }
}

testConnection();
