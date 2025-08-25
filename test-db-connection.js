const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 TESTING DATABASE CONNECTION');
  console.log('==============================\n');
  
  const configs = [
    { host: 'localhost', port: 3306, user: 'root', password: '', name: 'Default Config' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '', name: 'IP Address' },
    { host: 'localhost', port: 3306, user: 'root', password: 'root', name: 'Password: root' },
  ];
  
  for (const config of configs) {
    try {
      console.log(`Testing ${config.name}...`);
      console.log(`  Host: ${config.host}:${config.port}`);
      console.log(`  User: ${config.user}`);
      console.log(`  Pass: ${config.password || '(empty)'}`);
      
      const connection = await mysql.createConnection({
        ...config,
        connectTimeout: 5000
      });
      
      const [result] = await connection.execute('SELECT "Connection OK" as status, NOW() as time');
      await connection.end();
      
      console.log('✅ SUCCESS!');
      console.log(`   Status: ${result[0].status}`);
      console.log(`   Time: ${result[0].time}`);
      console.log('');
      
      // Test poker_online database
      try {
        const dbConnection = await mysql.createConnection({
          ...config,
          database: 'poker_online'
        });
        
        const [tables] = await dbConnection.execute('SHOW TABLES');
        await dbConnection.end();
        
        console.log('✅ poker_online database exists');
        console.log(`   Tables: ${tables.length}`);
        tables.forEach(row => {
          console.log(`   - ${Object.values(row)[0]}`);
        });
        
      } catch (dbError) {
        console.log('⚠️  poker_online database not found');
        console.log('   Run: node setup-database-simple.js');
      }
      
      console.log('\n🎉 DATABASE CONNECTION WORKING!');
      return true;
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log('');
    }
  }
  
  console.log('❌ ALL CONNECTION ATTEMPTS FAILED');
  console.log('\n🚨 TROUBLESHOOTING:');
  console.log('1. Make sure MySQL is running in Laragon/XAMPP');
  console.log('2. Check if port 3306 is available');
  console.log('3. Verify MySQL credentials');
  console.log('4. Try restarting MySQL service');
  
  return false;
}

testConnection().catch(console.error);
