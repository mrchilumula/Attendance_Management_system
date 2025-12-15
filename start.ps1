# Attendance Management System - Startup Script
# This script automatically clears ports and starts both backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Attendance Management System Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to kill process on a specific port
function Clear-Port {
    param([int]$Port)
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess
        $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
        Write-Host "  Port $Port is in use by $processName (PID: $processId)" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "  Killed process on port $Port" -ForegroundColor Green
    } else {
        Write-Host "  Port $Port is free" -ForegroundColor Green
    }
}

# Clear ports
Write-Host "Clearing ports..." -ForegroundColor Cyan
Clear-Port -Port 5000
Clear-Port -Port 3000
Start-Sleep -Seconds 1
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servers Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Login: admin@crrit.edu.in / password123" -ForegroundColor Yellow
Write-Host ""

# Wait a moment then open browser
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
