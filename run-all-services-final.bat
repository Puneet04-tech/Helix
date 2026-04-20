@echo off
title Helix Services - All 3 Running
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          HELIX SYSTEM - ALL SERVICES LAUNCHER              ║
echo ║    Hotel Backend + Hospital Backend + Frontend Ready       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if dependencies are installed
echo Checking dependencies...
if not exist "backend\node_modules" (
    echo Installing hotel-system dependencies...
    cd backend
    call npm install --legacy-peer-deps
    cd ..
)

if not exist "hospital-system\node_modules" (
    echo Installing hospital-system dependencies...
    cd hospital-system
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              LAUNCHING SERVICES IN NEW WINDOWS             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Start Hotel Backend on port 5000
echo [1] Starting Hotel Backend on port 5000...
start "Hotel Backend - Port 5000" cmd /k cd backend ^& npm start
timeout /t 3 /nobreak

REM Start Hospital Backend on port 5001
echo [2] Starting Hospital Backend on port 5001...
start "Hospital Backend - Port 5001" cmd /k cd hospital-system ^& npm start
timeout /t 3 /nobreak

REM Start Frontend on port 3000
echo [3] Starting Frontend on port 3000...
start "Frontend - Port 3000" cmd /k cd frontend ^& npm run dev
timeout /t 3 /nobreak

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   ALL SERVICES STARTED                     ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  🏨 Hotel Backend:     http://localhost:5000/api           ║
echo ║  🏥 Hospital Backend:  http://localhost:5001/api           ║
echo ║  💻 Frontend:          http://localhost:3000               ║
echo ║                                                            ║
echo ║  Status: ✅ READY FOR TESTING                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Waiting for all services to initialize...
timeout /t 10 /nobreak

echo.
echo Opening frontend in browser...
start http://localhost:3000

echo.
echo ✓ Setup complete! All three services are running.
echo   - Check each window for startup logs
echo   - Frontend should open automatically
echo   - Close any window to stop that service
echo.
pause
