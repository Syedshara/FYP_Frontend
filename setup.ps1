# ========================================================
#  IoT IDS Platform - Initial Setup Script
# ========================================================
# This script sets up the project for first-time users:
# - Installs frontend dependencies
# - Creates .env file with default configuration
# - Builds Docker images
# - Runs database migrations
#
# Run this script once after cloning the repository
# ========================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   IoT IDS Platform - Initial Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[*] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Docker is not running. Please start Docker Desktop and run this script again." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[X] Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "[*] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "[X] Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "[*] Setting up environment variables..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    @"
# Database Configuration
POSTGRES_DB=iot_ids
POSTGRES_USER=iot_admin
POSTGRES_PASSWORD=iot_secure_pass

# Backend Configuration
DATABASE_URL=postgresql://iot_admin:iot_secure_pass@postgres:5432/iot_ids
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ML Model Paths
MODEL_PATH=/app/models/global_final.pt
SCALER_PATH=/app/models/scaler.pkl
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "[OK] Created .env file with default configuration" -ForegroundColor Green
} else {
    Write-Host "[OK] .env file already exists" -ForegroundColor Green
}

# Install frontend dependencies
Write-Host ""
Write-Host "[*] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[X] Error installing frontend dependencies: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Build Docker images
Write-Host ""
Write-Host "[*] Building Docker images (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to build Docker images" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker images built successfully" -ForegroundColor Green

# Start services
Write-Host ""
Write-Host "[*] Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for backend to be ready
Write-Host ""
Write-Host "[*] Waiting for backend to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and !$backendReady) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    } catch {
        # Backend not ready yet
    }
    $attempt++
    Write-Host "." -NoNewline
}

Write-Host ""
if ($backendReady) {
    Write-Host "[OK] Backend is ready" -ForegroundColor Green
} else {
    Write-Host "[!] Backend took longer than expected to start. Check logs with: docker logs iot_ids_backend" -ForegroundColor Yellow
}

# Success message
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   [SUCCESS] Setup Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "To start the project in the future, run:" -ForegroundColor Cyan
Write-Host "   .\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services, run:" -ForegroundColor Cyan
Write-Host "   .\stop.ps1" -ForegroundColor White
Write-Host ""
