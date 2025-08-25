import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Default XAMPP/Laragon password
  database: 'poker_online'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';

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

  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email dan password wajib diisi' 
    });
  }

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);

    // Find user by email
    const [users] = await connection.execute(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, 
              u.avatar_url, u.is_active, u.is_banned, u.ban_until,
              cw.balance as chips_balance
       FROM users u 
       LEFT JOIN chips_wallet cw ON u.id = cw.user_id 
       WHERE u.email = ?`,
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ 
        message: 'Email atau password salah' 
      });
    }

    const user = users[0] as any;

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        message: 'Akun Anda tidak aktif. Silakan hubungi administrator.' 
      });
    }

    // Check if user is banned
    if (user.is_banned) {
      const banUntil = user.ban_until ? new Date(user.ban_until) : null;
      const now = new Date();
      
      if (!banUntil || banUntil > now) {
        return res.status(401).json({ 
          message: 'Akun Anda telah diblokir. Silakan hubungi administrator.' 
        });
      } else {
        // Unban user if ban period has expired
        await connection.execute(
          'UPDATE users SET is_banned = 0, ban_until = NULL WHERE id = ?',
          [user.id]
        );
      }
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ 
        message: 'Akun ini menggunakan login sosial. Silakan login dengan Google atau Facebook.' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Email atau password salah' 
      });
    }

    // Update last login
    await connection.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Log activity
    await connection.execute(
      `INSERT INTO activity_logs (
        id, user_id, activity_type, description, 
        ip_address, created_at
      ) VALUES (UUID(), ?, 'login', 'User logged in successfully', ?, NOW())`,
      [user.id, req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown']
    );

    // Generate JWT token
    const payload = { 
      email: user.email, 
      sub: user.id 
    };
    const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // Return success response
    res.status(200).json({
      access_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        chipsBalance: user.chips_balance || 0
      }
    });

  } catch (error) {
    console.error('Login error:', error);

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
