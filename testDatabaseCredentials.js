const mysql = require('mysql2/promise');

// Kombinasi kredensial yang umum di Laragon/XAMPP
const credentials = [
  { user: 'root', password: '', description: 'Default Laragon/XAMPP (no password)' },
  { user: 'root', password: 'root', description: 'Root with root password' },
  { user: 'root', password: 'password', description: 'Root with password' },
  { user: 'root', password: '123456', description: 'Root with 123456' },
  { user: 'poker_user', password: '', description: 'Custom poker user (no password)' },
  { user: 'poker_user', password: 'poker123', description: 'Custom poker user with password' }
];

async function testCredential(cred) {
  try {
    console.log(`\n🔍 Testing: ${cred.description}`);
    console.log(`   User: ${cred.user}, Password: ${cred.password || '(empty)'}`);
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: cred.user,
      password: cred.password,
      database: 'poker_online',
      timeout: 5000
    });

    console.log('✅ Connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', ['poker_online']);
    console.log(`📊 Database has ${rows[0].table_count} tables`);
    
    // Test users table
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
      console.log(`👤 Users table has ${users[0].user_count} records`);
    } catch (err) {
      console.log('⚠️  Users table not accessible:', err.message);
    }
    
    await connection.end();
    return { success: true, ...cred };
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message, ...cred };
  }
}

async function findWorkingCredentials() {
  console.log('🔐 Testing Database Credentials for Laragon MySQL...\n');
  console.log('Database: poker_online');
  console.log('Host: localhost:3306\n');
  
  const results = [];
  
  for (const cred of credentials) {
    const result = await testCredential(cred);
    results.push(result);
    
    if (result.success) {
      console.log('\n🎉 WORKING CREDENTIALS FOUND!');
      console.log('='.repeat(50));
      console.log(`User: ${result.user}`);
      console.log(`Password: ${result.password || '(empty)'}`);
      console.log(`Description: ${result.description}`);
      console.log('='.repeat(50));
      
      // Generate .env content
      console.log('\n📝 Add this to backend/.env:');
      console.log('DATABASE_TYPE=mysql');
      console.log('DATABASE_HOST=localhost');
      console.log('DATABASE_PORT=3306');
      console.log(`DATABASE_USERNAME=${result.user}`);
      console.log(`DATABASE_PASSWORD=${result.password}`);
      console.log('DATABASE_NAME=poker_online');
      
      break;
    }
  }
  
  const workingCreds = results.filter(r => r.success);
  if (workingCreds.length === 0) {
    console.log('\n❌ No working credentials found!');
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Make sure MySQL server is running in Laragon');
    console.log('2. Check Laragon MySQL settings');
    console.log('3. Try accessing phpMyAdmin to verify credentials');
    console.log('4. Create database "poker_online" if it doesn\'t exist');
    console.log('5. Import schema-mysql.sql file');
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled error:', err.message);
});

findWorkingCredentials();
