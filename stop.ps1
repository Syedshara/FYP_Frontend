# ========================================================
#  IoT IDS Platform - Stop Script
# ========================================================
# This script stops all Docker containers for the IoT IDS Platform
# Note: Frontend (Vite) needs to be stopped manually in its terminal window (Ctrl+C)
# ========================================================

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   IoT IDS Platform - Stopping Services" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[*] Stopping backend services..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Backend services stopped" -ForegroundColor Green
} else {
    Write-Host "[X] Failed to stop services" -ForegroundColor Red
    exit 1
}

# Stop frontend processes
Write-Host ""
Write-Host "[*] Stopping frontend processes..." -ForegroundColor Yellow
$nodeProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "vite" -or $_.CommandLine -match "npm" }

if ($nodeProcesses) {
    $count = 0
    foreach ($proc in $nodeProcesses) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
            $count++
        } catch {}
    }
    Write-Host "[OK] Stopped $count frontend process(es)" -ForegroundColor Green
} else {
    Write-Host "[OK] No frontend processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   [SUCCESS] All Services Stopped!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start again, run:" -ForegroundColor Cyan
Write-Host "   .\start.ps1" -ForegroundColor White
Write-Host ""
