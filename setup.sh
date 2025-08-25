#!/bin/bash

# Setup script untuk Website Poker Online Gratis - Texas Hold'em
# Script ini akan menginstall semua dependencies dan setup environment

echo "🃏 Setting up Poker Online Gratis - Texas Hold'em"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    echo "   You can also use Docker: docker-compose up postgres"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
echo "======================================"
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo "✅ Backend dependencies installed successfully"

echo ""
echo "📦 Installing Frontend Dependencies..."
echo "======================================="
cd ../frontend
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo "✅ Frontend dependencies installed successfully"

echo ""
echo "⚙️  Setting up Environment Files..."
echo "===================================="
cd ..

# Setup backend environment
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from example"
    echo "⚠️  Please edit backend/.env with your configuration"
else
    echo "ℹ️  backend/.env already exists"
fi

# Setup frontend environment
if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local from example"
    echo "⚠️  Please edit frontend/.env.local with your configuration"
else
    echo "ℹ️  frontend/.env.local already exists"
fi

echo ""
echo "🗄️  Database Setup..."
echo "====================="
echo "To setup the database, run one of the following:"
echo ""
echo "Option 1 - Using Docker (Recommended for development):"
echo "  docker-compose up postgres"
echo ""
echo "Option 2 - Using local PostgreSQL:"
echo "  createdb poker_online"
echo "  psql -d poker_online -f database/schema.sql"
echo ""

echo ""
echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit environment files:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Setup database (see options above)"
echo ""
echo "3. Start development servers:"
echo "   Terminal 1: cd backend && npm run start:dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "4. Or use Docker Compose:"
echo "   docker-compose up"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo "   pgAdmin: http://localhost:5050 (if using Docker)"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "Happy coding! 🎉"
