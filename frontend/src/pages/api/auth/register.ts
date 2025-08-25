import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Default XAMPP/Laragon password
  database: 'poker_online'
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, email, password, fullName, referralCode } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ 
      message: 'Username, email, dan password wajib diisi' 
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      message: 'Format email tidak valid' 
    });
  }

  // Username validation
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ 
      message: 'Username harus antara 3-50 karakter' 
    });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ 
      message: 'Username hanya boleh mengandung huruf, angka, dan underscore' 
    });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ 
      message: 'Password minimal 6 karakter' 
    });
  }

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);

    // Check if email already exists
    const [existingEmail] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingEmail) && existingEmail.length > 0) {
      return res.status(409).json({ 
        message: 'Email sudah terdaftar' 
      });
    }

    // Check if username already exists
    const [existingUsername] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (Array.isArray(existingUsername) && existingUsername.length > 0) {
      return res.status(409).json({ 
        message: 'Username sudah digunakan' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate user ID and referral code
    const userId = uuidv4();
    const userReferralCode = Math.random().toString(36).substring(2, 12).toUpperCase();

    // Start transaction
    await connection.beginTransaction();

    try {
      // Create user
      await connection.execute(
        `INSERT INTO users (
          id, username, email, password_hash, full_name, 
          referral_code, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, username, email, hashedPassword, fullName || null, userReferralCode]
      );

      // Create chips wallet with bonus
      await connection.execute(
        `INSERT INTO chips_wallet (
          id, user_id, balance, total_bonus_received, created_at, updated_at
        ) VALUES (?, ?, 5000000, 5000000, NOW(), NOW())`,
        [uuidv4(), userId]
      );

      // Handle referral if provided
      if (referralCode) {
        const [referrer] = await connection.execute(
          'SELECT id FROM users WHERE referral_code = ?',
          [referralCode]
        );

        if (Array.isArray(referrer) && referrer.length > 0) {
          const referrerId = (referrer[0] as any).id;
          
          // Create referral record
          await connection.execute(
            `INSERT INTO referrals (
              id, referrer_user_id, referred_user_id, 
              referrer_bonus, referred_bonus, created_at
            ) VALUES (?, ?, ?, 1000000, 500000, NOW())`,
            [uuidv4(), referrerId, userId]
          );

          // Add bonus to referrer
          await connection.execute(
            'UPDATE chips_wallet SET balance = balance + 1000000, total_bonus_received = total_bonus_received + 1000000 WHERE user_id = ?',
            [referrerId]
          );

          // Add bonus to new user
          await connection.execute(
            'UPDATE chips_wallet SET balance = balance + 500000, total_bonus_received = total_bonus_received + 500000 WHERE user_id = ?',
            [userId]
          );
        }
      }

      // Log activity
      await connection.execute(
        `INSERT INTO activity_logs (
          id, user_id, activity_type, description, 
          ip_address, created_at
        ) VALUES (?, ?, 'register', 'User registered successfully', ?, NOW())`,
        [uuidv4(), userId, req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown']
      );

      // Commit transaction
      await connection.commit();

      // Return success response
      res.status(201).json({
        message: 'Registrasi berhasil!',
        user: {
          id: userId,
          username,
          email,
          fullName: fullName || null,
          referralCode: userReferralCode
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Register error:', error);

    // Handle specific database errors
    if ((error as any).code === 'ER_BAD_DB_ERROR') {
      return res.status(500).json({ 
        message: 'Database tidak ditemukan. Silakan hubungi administrator.' 
      });
    }

    if ((error as any).code === 'ECONNREFUSED') {
      return res.status(500).json({ 
        message: 'Tidak dapat terhubung ke database. Silakan coba lagi nanti.' 
      });
    }

    if ((error as any).code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ 
        message: 'Kesalahan konfigurasi database. Silakan hubungi administrator.' 
      });
    }

    return res.status(500).json({ 
      message: 'Terjadi kesalahan server. Silakan coba lagi.' 
    });

  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
