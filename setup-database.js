const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️  Setting up database...');
  
  try {
    // First, connect without specifying database to create it
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '', // Default XAMPP/Laragon password
    });

    console.log('✅ Connected to MySQL server');

    // Create database if not exists
    await connection.execute('CREATE DATABASE IF NOT EXISTS poker_online');
    console.log('✅ Database "poker_online" created/verified');

    await connection.end();

    // Now connect to the specific database
    const dbConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'poker_online'
    });

    console.log('✅ Connected to poker_online database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'database', 'schema-mysql.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbConnection.execute(statement);
          } catch (error) {
            // Ignore table already exists errors
            if (!error.message.includes('already exists')) {
              console.warn('Warning executing statement:', error.message);
            }
          }
        }
      }
      
      console.log('✅ Database schema imported successfully');
    } else {
      console.log('⚠️  Schema file not found, skipping schema import');
    }

    // Test the setup by checking tables
    const [tables] = await dbConnection.execute('SHOW TABLES');
    console.log('📋 Tables in database:');
    tables.forEach(row => {
      console.log(`  - ${Object.values(row)[0]}`);
    });

    await dbConnection.end();
    console.log('✅ Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('  - Start MySQL server (XAMPP/Laragon)');
      console.log('  - Check if port 3306 is correct');
      console.log('  - Make sure MySQL service is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Suggestions:');
      console.log('  - Check MySQL username/password');
      console.log('  - Default XAMPP/Laragon: user=root, password=""');
    }
    
    process.exit(1);
  }
}

setupDatabase();
