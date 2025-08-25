/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'poker-online-gratis',
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'lh3.googleusercontent.com', // Google profile images
      'graph.facebook.com', // Facebook profile images
      'platform-lookaside.fbsbx.com', // Facebook CDN
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for security
  async headers() {
    return [
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

  // API rewrites to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
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
    // Custom webpack config if needed
    return config;
  },

  // Experimental features
  experimental: {
    appDir: false, // Using pages router for now
  },

  // Output configuration for deployment
  output: 'standalone',
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;
