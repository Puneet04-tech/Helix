@echo off
echo.
echo ==========================================
echo    🏨 Hotel Management System Startup
echo ==========================================
echo.

cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js found: %NODE_VERSION%

REM Start Backend
echo.
echo 📦 Starting Hotel Backend (Port 4000)...
cd backend
call npm install --silent
start cmd /k "npm run dev"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start Frontend
echo.
echo 💻 Starting Hotel Frontend (Port 4001)...
cd frontend
call npm install --silent
start cmd /k "npm run dev"
cd ..

REM Show URLs
echo.
echo ==========================================
echo    ✨ System Startup Complete!
echo ==========================================
echo.
echo 🏨 Hotel Dashboard:    http://localhost:4001
echo 🌐 Hotel API:          http://localhost:4000/api
echo 📊 Helix Dashboard:    http://localhost:3003
echo.
echo ⚠️  Make sure Helix Backend is running on port 5000
echo.
echo 📋 Check the two terminal windows for server logs
echo.
pause
