@echo off
REM Helix Demo Quick Start Script for Windows
REM Run this to start both backend and frontend

echo.
echo ======================================
echo   🚀 Starting Helix Platform
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found:
node --version
echo.

REM Navigate to the project root
cd /d "%~dp0"

REM Start backend in a new window
echo 📦 Starting Backend Server (NestJS on port 5000)...
echo.
cd backend

if not exist "node_modules" (
    echo 📥 Installing backend dependencies...
    call npm install
)

start "Helix Backend" cmd /k npm run start:dev
echo ✅ Backend starting in new window...
echo.

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window
echo 🎨 Starting Frontend Server (Next.js on port 3000)...
echo.
cd ..\frontend

if not exist "node_modules" (
    echo 📥 Installing frontend dependencies...
    call npm install
)

start "Helix Frontend" cmd /k npm run dev
echo ✅ Frontend starting in new window...
echo.

REM Show instructions
echo.
echo ======================================
echo   🌐 Servers Starting
echo ======================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo ⏳ Servers may take 10-15 seconds to fully start.
echo Please wait and then open http://localhost:3000 in your browser.
echo.
echo ============ DEMO INSTRUCTIONS ===========
echo.
echo 1. Open http://localhost:3000 in your browser
echo 2. Click "Sign Up" and create a test account
echo 3. Go to Dashboard
echo 4. Click "Start Live Demo" button (green)
echo 5. Watch incidents stream in real-time! 🚀
echo 6. Click any incident to see detailed analysis modal
echo.
echo 📚 For full guide, see: JUDGE_DEMO_GUIDE.md
echo.
echo 👉 You can close this window anytime.
echo Both backend and frontend will continue running.
echo.
pause
