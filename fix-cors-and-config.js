const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing CORS and configuration issues...\n');

// 1. Create or update next.config.js with better error handling
const nextConfigPath = path.join(__dirname, 'frontend', 'next.config.js');
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'poker-online-gratis',
    JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
    DB_HOST: 'localhost',
    DB_PORT: '3306',
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'poker_online'
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Remove API rewrites since we're using API routes directly
  async rewrites() {
    return [];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/game',
        destination: '/lobby',
        permanent: true,
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle bcrypt for client-side (shouldn't be used client-side anyway)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // Experimental features
  experimental: {
    appDir: false,
  },

  // Output configuration
  output: 'standalone',
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;
`;

try {
  fs.writeFileSync(nextConfigPath, nextConfigContent);
  console.log('✅ Updated next.config.js with better CORS and config\n');
} catch (error) {
  console.log('❌ Failed to update next.config.js:', error.message);
}

// 2. Create environment variables file
const envPath = path.join(__dirname, 'frontend', '.env.local');
const envContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=poker_online

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# App Configuration
NEXT_PUBLIC_APP_NAME=Poker Online Gratis
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development
NODE_ENV=development
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with environment variables\n');
} catch (error) {
  console.log('❌ Failed to create .env.local:', error.message);
}

// 3. Update register API to handle CORS better
const registerApiPath = path.join(__dirname, 'frontend', 'src', 'pages', 'api', 'auth', 'register.ts');

if (fs.existsSync(registerApiPath)) {
  let registerContent = fs.readFileSync(registerApiPath, 'utf8');
  
  // Add CORS handling at the beginning of the handler
  const corsHandler = `
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
`;

  // Insert CORS handler after the method check
  if (!registerContent.includes('Access-Control-Allow-Origin')) {
    registerContent = registerContent.replace(
      'if (req.method !== \'POST\') {',
      corsHandler + '\n  if (req.method !== \'POST\') {'
    );
    
    try {
      fs.writeFileSync(registerApiPath, registerContent);
      console.log('✅ Updated register API with CORS handling\n');
    } catch (error) {
      console.log('❌ Failed to update register API:', error.message);
    }
  }
}

// 4. Update login API to handle CORS better
const loginApiPath = path.join(__dirname, 'frontend', 'src', 'pages', 'api', 'auth', 'login.ts');

if (fs.existsSync(loginApiPath)) {
  let loginContent = fs.readFileSync(loginApiPath, 'utf8');
  
  // Add CORS handling
  const corsHandler = `
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
`;

  if (!loginContent.includes('Access-Control-Allow-Origin')) {
    loginContent = loginContent.replace(
      'if (req.method !== \'POST\') {',
      corsHandler + '\n  if (req.method !== \'POST\') {'
    );
    
    try {
      fs.writeFileSync(loginApiPath, loginContent);
      console.log('✅ Updated login API with CORS handling\n');
    } catch (error) {
      console.log('❌ Failed to update login API:', error.message);
    }
  }
}

// 5. Create a comprehensive error logging middleware
const errorLoggerPath = path.join(__dirname, 'frontend', 'src', 'pages', 'api', 'middleware', 'errorLogger.ts');
const errorLoggerDir = path.dirname(errorLoggerPath);

if (!fs.existsSync(errorLoggerDir)) {
  fs.mkdirSync(errorLoggerDir, { recursive: true });
}

const errorLoggerContent = `import { NextApiRequest, NextApiResponse } from 'next';

export function withErrorLogging(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res);
    } catch (error: any) {
      console.error('API Error:', {
        url: req.url,
        method: req.method,
        error: error.message,
        stack: error.stack,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  };
}

export function logRequest(req: NextApiRequest) {
  console.log('API Request:', {
    url: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
}
`;

try {
  fs.writeFileSync(errorLoggerPath, errorLoggerContent);
  console.log('✅ Created error logging middleware\n');
} catch (error) {
  console.log('❌ Failed to create error logger:', error.message);
}

// 6. Create a database connection test endpoint
const dbTestPath = path.join(__dirname, 'frontend', 'src', 'pages', 'api', 'test', 'db.ts');
const dbTestDir = path.dirname(dbTestPath);

if (!fs.existsSync(dbTestDir)) {
  fs.mkdirSync(dbTestDir, { recursive: true });
}

const dbTestContent = `import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'poker_online',
    });

    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();

    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      data: rows
    });

  } catch (error: any) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
}
`;

try {
  fs.writeFileSync(dbTestPath, dbTestContent);
  console.log('✅ Created database test endpoint (/api/test/db)\n');
} catch (error) {
  console.log('❌ Failed to create database test endpoint:', error.message);
}

console.log('🎉 CORS and configuration fixes completed!\n');
console.log('📋 Changes made:');
console.log('   ✅ Updated next.config.js with better CORS headers');
console.log('   ✅ Created .env.local with environment variables');
console.log('   ✅ Added CORS handling to API endpoints');
console.log('   ✅ Created error logging middleware');
console.log('   ✅ Created database test endpoint');
console.log('\n🔄 Next steps:');
console.log('   1. Restart frontend server: cd frontend && npm run dev');
console.log('   2. Test database: http://localhost:3000/api/test/db');
console.log('   3. Test register: http://localhost:3000/register');
