@echo off
title Attendance Management System
echo ========================================
echo   Attendance Management System Startup
echo ========================================
echo.

REM Kill any existing node processes on ports 5000 and 3000
echo Clearing ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Ports cleared!
echo.

REM Start Backend in new window
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo.
echo   Login: admin@crrit.edu.in / password123
echo.

REM Wait and open browser
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo Press any key to exit this window...
pause >nul
