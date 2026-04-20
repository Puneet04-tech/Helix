@echo off
REM ========================================================================
REM Helix Multi-System Runner - Stable Version
REM Runs Hotel System and Frontend (Hospital system in separate manual window)
REM ========================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo  HELIX - Running All Services
echo ========================================================================
echo.
echo Starting services in separate windows:
echo   - Hotel Backend     (NestJS on port 5000)
echo   - Frontend          (Next.js on port 3000)
echo   - Hospital Backend  (Manual - see instructions below)
echo.
echo Press Ctrl+C in each window to stop individual services
echo ========================================================================
echo.

REM Check if node_modules exist, if not install dependencies
if not exist "backend\node_modules" (
    echo [1/2] Installing hotel backend dependencies...
    cd backend
    call npm install --legacy-peer-deps
    cd ..
)

if not exist "frontend\node_modules" (
    echo [2/2] Installing frontend dependencies...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
)

echo.
echo Starting services...
echo.

REM Start Hotel Backend in a new window
echo Starting Hotel Backend on port 5000...
start "Hotel Backend (Port 5000)" cmd /k "cd backend && npm start"

REM Start Frontend in a new window
echo Starting Frontend on port 3000...
start "Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================================
echo Services are starting in separate windows...
echo.
echo WAIT 30-60 seconds for services to initialize, then access:
echo   - Frontend:  http://localhost:3000
echo   - Hotel API: http://localhost:5000
echo.
echo SERVICE WINDOWS:
echo   - Hotel Backend: 'Hotel Backend (Port 5000)'
echo   - Frontend:      'Frontend (Port 3000)'
echo.
echo HOSPITAL BACKEND (Manual Start):
echo ========================================================================
echo To start Hospital Backend on port 5001, open a new terminal and run:
echo.
echo   cd E:\Helix\hospital-system
echo   npm install --legacy-peer-deps
echo   npm run dev
echo.
echo OR use the full install:
echo.
echo   npm install
echo   npm run build
echo   npm start
echo.
echo Then access: http://localhost:5001
echo ========================================================================
echo.
echo To stop all services, close each window individually.
echo ========================================================================
echo.

endlocal
timeout /t 10
