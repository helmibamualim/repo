import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

// Ensure database directory exists
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'poker_online.db');

// Initialize database with tables if not exists
function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
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
    `;
    
    db.exec(createTables, (err) => {
      db.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { username, email, password, fullName, referralCode } = req.body;

  // Input validation
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username, email, dan password wajib diisi' 
    });
  }

  if (username.length < 3) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username minimal 3 karakter' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password minimal 6 karakter' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Format email tidak valid' 
    });
  }

  try {
    console.log('🔗 Initializing SQLite database...');
    
    // Initialize database
    await initializeDatabase();
    
    const db = new sqlite3.Database(dbPath);
    
    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await new Promise<any>((resolve, reject) => {
      db.get('SELECT id, email, username FROM users WHERE email = ? OR username = ?', 
        [email, username], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (existingUser) {
      db.close();
      const conflictField = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({ 
        success: false, 
        message: `${conflictField === 'email' ? 'Email' : 'Username'} sudah terdaftar` 
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code
    const generateReferralCode = () => {
      return username.toLowerCase().substring(0, 4) + Math.random().toString(36).substring(2, 6);
    };
    
    let userReferralCode = generateReferralCode();
    
    // Ensure referral code is unique
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 5) {
      const existingCode = await new Promise<any>((resolve, reject) => {
        db.get('SELECT id FROM users WHERE referral_code = ?', [userReferralCode], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (!existingCode) {
        codeExists = false;
      } else {
        userReferralCode = generateReferralCode();
        attempts++;
      }
    }

    // Handle referral if provided
    let referrerId = null;
    if (referralCode) {
      console.log('🎁 Processing referral code...');
      const referrer = await new Promise<any>((resolve, reject) => {
        db.get('SELECT id, username FROM users WHERE referral_code = ?', [referralCode], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (referrer) {
        referrerId = referrer.id;
        console.log('✅ Valid referral code found');
      }
    }

    // Create new user
    console.log('👤 Creating new user...');
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    await new Promise<void>((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO users (id, username, email, password_hash, full_name, chips, referral_code, referred_by) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      stmt.run([
        userId,
        username,
        email,
        hashedPassword,
        fullName || null,
        referrerId ? 6000000 : 5000000, // Bonus 1M chips if referred
        userReferralCode,
        referrerId
      ], (err) => {
        stmt.finalize();
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ User created successfully');

    // Process referral bonus
    if (referrerId) {
      console.log('💰 Processing referral bonus...');
      
      // Give bonus to referrer
      await new Promise<void>((resolve, reject) => {
        db.run('UPDATE users SET chips = chips + 1000000 WHERE id = ?', [referrerId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Log referral bonus
      await new Promise<void>((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)');
        stmt.run([
          referrerId,
          'REFERRAL_BONUS',
          `Received 1M chips bonus for referring user: ${username}`,
          req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
        ], (err) => {
          stmt.finalize();
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log('✅ Referral bonus processed');
    }

    // Log user registration
    await new Promise<void>((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)');
      stmt.run([
        userId,
        'REGISTER',
        `User registered successfully${referrerId ? ' with referral' : ''}`,
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      ], (err) => {
        stmt.finalize();
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('📝 Activity logged');
    
    db.close();

    // Return success response
    const responseData = {
      success: true,
      message: 'Registrasi berhasil! Selamat datang di Poker Online!',
      user: {
        id: userId,
        username,
        email,
        fullName: fullName || null,
        chips: referrerId ? 6000000 : 5000000,
        referralCode: userReferralCode,
        createdAt: new Date().toISOString()
      },
      bonuses: {
        welcomeBonus: 5000000,
        referralBonus: referrerId ? 1000000 : 0,
        totalChips: referrerId ? 6000000 : 5000000
      }
    };

    console.log('🎉 Registration completed successfully');
    return res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message
      } : undefined
    });
  }
}
