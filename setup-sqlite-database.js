const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function setupSQLiteDatabase() {
  console.log('🔧 SETUP SQLITE DATABASE (ALTERNATIF)');
  console.log('=====================================\n');
  
  try {
    // Buat folder database jika belum ada
    const dbDir = path.join(__dirname, 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
    }
    
    const dbPath = path.join(dbDir, 'poker_online.db');
    
    console.log('1️⃣ Creating SQLite database...');
    console.log(`   Path: ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath);
    
    // Create tables
    const createTables = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        chips INTEGER DEFAULT 5000000,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS referral_bonuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_id TEXT NOT NULL,
        referred_id TEXT NOT NULL,
        bonus_amount INTEGER DEFAULT 1000000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const statements = createTables.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      await new Promise((resolve, reject) => {
        db.run(statement, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    console.log('✅ SQLite tables created successfully');
    
    // Test insert
    await new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO users (username, email, password_hash, full_name) 
              VALUES ('testuser', 'test@example.com', 'hashedpassword', 'Test User')`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Test data inserted');
    
    db.close();
    
    console.log('\n2️⃣ Creating SQLite API endpoints...');
    
    // Update register API untuk SQLite
    const sqliteRegisterAPI = `
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const dbPath = path.join(process.cwd(), 'database', 'poker_online.db');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, email, password, fullName, referralCode } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, dan password wajib diisi' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username minimal 3 karakter' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }

  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid' });
  }

  try {
    const db = new sqlite3.Database(dbPath);
    
    // Check existing user
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      db.close();
      return res.status(409).json({ message: 'Email atau username sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate referral code
    const referralCodeGenerated = username.toLowerCase() + Math.random().toString(36).substr(2, 4);
    
    // Insert user
    const userId = await new Promise((resolve, reject) => {
      const stmt = db.prepare(\`INSERT INTO users (username, email, password_hash, full_name, referral_code, referred_by) 
                                VALUES (?, ?, ?, ?, ?, ?)\`);
      
      stmt.run([username, email, hashedPassword, fullName || null, referralCodeGenerated, null], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });

    // Log activity
    const stmt = db.prepare('INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)');
    stmt.run([userId, 'REGISTER', 'User registered successfully', req.headers['x-forwarded-for'] || req.connection.remoteAddress]);
    stmt.finalize();

    db.close();

    res.status(201).json({
      message: 'Registrasi berhasil!',
      user: {
        id: userId,
        username,
        email,
        fullName: fullName || null,
        chips: 5000000,
        referralCode: referralCodeGenerated
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}
`;
    
    // Write SQLite register API
    const apiPath = path.join(__dirname, 'frontend', 'src', 'pages', 'api', 'auth', 'register-sqlite.ts');
    fs.writeFileSync(apiPath, sqliteRegisterAPI);
    
    console.log('✅ SQLite register API created');
    
    // Update environment
    const envContent = `
# SQLite Database Configuration
DB_TYPE=sqlite
DB_PATH=./database/poker_online.db

# JWT Secret
JWT_SECRET=poker_secret_key_${Date.now()}

# App Config
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
`;
    
    const envPath = path.join(__dirname, 'frontend', '.env.local');
    fs.writeFileSync(envPath, envContent.trim());
    
    console.log('✅ Environment updated for SQLite');
    
    console.log('\n🎉 SQLITE DATABASE SETUP COMPLETED!');
    console.log('\n📝 Keuntungan SQLite:');
    console.log('   - Tidak perlu MySQL server');
    console.log('   - Database file lokal');
    console.log('   - Lebih mudah setup');
    console.log('   - Cocok untuk development');
    
    console.log('\n🚀 Next steps:');
    console.log('1. cd frontend');
    console.log('2. npm install sqlite3');
    console.log('3. npm run dev');
    console.log('4. Test: http://localhost:3000/register');
    
  } catch (error) {
    console.error('\n❌ SQLite setup failed:', error.message);
  }
}

setupSQLiteDatabase();
