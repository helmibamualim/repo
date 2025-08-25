# Setup script untuk Website Poker Online Gratis - Texas Hold'em (Windows PowerShell)
# Script ini akan menginstall semua dependencies dan setup environment

Write-Host "🃏 Setting up Poker Online Gratis - Texas Hold'em" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Check Node.js version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if PostgreSQL is installed
try {
    psql --version | Out-Null
    Write-Host "✅ PostgreSQL is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL is not installed. Please install PostgreSQL 14+ first." -ForegroundColor Yellow
    Write-Host "   You can also use Docker: docker-compose up postgres" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing Backend Dependencies..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Set-Location backend

if (-not (Test-Path "package.json")) {
    Write-Host "❌ Backend package.json not found!" -ForegroundColor Red
    exit 1
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Installing Frontend Dependencies..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Set-Location ../frontend

if (-not (Test-Path "package.json")) {
    Write-Host "❌ Frontend package.json not found!" -ForegroundColor Red
    exit 1
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "⚙️  Setting up Environment Files..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Set-Location ..

# Setup backend environment
if (-not (Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "✅ Created backend/.env from example" -ForegroundColor Green
    Write-Host "⚠️  Please edit backend/.env with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  backend/.env already exists" -ForegroundColor Blue
}

# Setup frontend environment
if (-not (Test-Path "frontend/.env.local")) {
    Copy-Item "frontend/.env.local.example" "frontend/.env.local"
    Write-Host "✅ Created frontend/.env.local from example" -ForegroundColor Green
    Write-Host "⚠️  Please edit frontend/.env.local with your configuration" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  frontend/.env.local already exists" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🗄️  Database Setup..." -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "To setup the database, run one of the following:" -ForegroundColor White
Write-Host ""
Write-Host "Option 1 - Using Docker (Recommended for development):" -ForegroundColor Yellow
Write-Host "  docker-compose up postgres" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Using local PostgreSQL:" -ForegroundColor Yellow
Write-Host "  createdb poker_online" -ForegroundColor White
Write-Host "  psql -d poker_online -f database/schema.sql" -ForegroundColor White
Write-Host ""

Write-Host ""
Write-Host "🚀 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit environment files:" -ForegroundColor White
Write-Host "   - backend/.env" -ForegroundColor Gray
Write-Host "   - frontend/.env.local" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Setup database (see options above)" -ForegroundColor White
Write-Host ""
Write-Host "3. Start development servers:" -ForegroundColor White
Write-Host "   Terminal 1: cd backend && npm run start:dev" -ForegroundColor Gray
Write-Host "   Terminal 2: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Or use Docker Compose:" -ForegroundColor White
Write-Host "   docker-compose up" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "   pgAdmin: http://localhost:5050 (if using Docker)" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see README.md" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green
