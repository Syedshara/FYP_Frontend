# ========================================================
#  IoT IDS Platform - Start Script
# ========================================================
# Starts all services for the IoT IDS Platform:
# - PostgreSQL database
# - Redis cache
# - FastAPI backend
# - React frontend (Vite dev server)
# ========================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   IoT IDS Platform - Starting Services" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[*] Checking Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Write-Host "[*] Waiting for Docker to start (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        # Check again
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[X] Failed to start Docker. Please start Docker Desktop manually." -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[X] Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start backend services (PostgreSQL, Redis, FastAPI)
Write-Host ""
Write-Host "[*] Starting backend services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to start backend services" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Backend services started" -ForegroundColor Green

# Wait for backend to be healthy
Write-Host ""
Write-Host "[*] Waiting for backend to be ready..." -ForegroundColor Yellow
$maxAttempts = 20
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and !$backendReady) {
    Start-Sleep -Seconds 2
    try {
        $logs = docker logs iot_ids_backend --tail 5 2>&1
        if ($logs -match "Uvicorn running on") {
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
    Write-Host "[!] Backend may still be starting. Check with: docker logs iot_ids_backend" -ForegroundColor Yellow
}

# Start frontend in new window
Write-Host ""
Write-Host "[*] Starting frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Create a script block to run in the new window
$command = "cd '$frontendPath'; npm run dev -- --host; Read-Host 'Press Enter to close'"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
Write-Host "[OK] Frontend started in new window" -ForegroundColor Green

# Success message
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   [SUCCESS] All Services Started!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: " -NoNewline -ForegroundColor White
docker ps --filter "name=iot_ids_postgres" --format "{{.Status}}" | Write-Host -ForegroundColor Green
Write-Host "   Redis:      " -NoNewline -ForegroundColor White
docker ps --filter "name=iot_ids_redis" --format "{{.Status}}" | Write-Host -ForegroundColor Green
Write-Host "   Backend:    " -NoNewline -ForegroundColor White
docker ps --filter "name=iot_ids_backend" --format "{{.Status}}" | Write-Host -ForegroundColor Green
Write-Host ""
Write-Host "To stop all services, run:" -ForegroundColor Cyan
Write-Host "   .\stop.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "   View backend logs:  docker logs iot_ids_backend -f" -ForegroundColor White
Write-Host "   View all services:  docker-compose -f docker-compose.dev.yml ps" -ForegroundColor White
Write-Host ""
