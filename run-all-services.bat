@echo off
REM ========================================================================
REM Helix Multi-System Runner (Optimized)
REM Runs Hotel System, Hospital System, and Frontend with dev servers
REM ========================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo  HELIX - Running All Services (Hotel + Hospital + Frontend)
echo ========================================================================
echo.
echo Starting services in separate windows:
echo   - Hotel Backend     (NestJS on port 5000)
echo   - Hospital Backend  (NestJS on port 5001) 
echo   - Frontend          (Next.js on port 3000)
echo.
echo Using dev mode for faster startup...
echo.
echo Press Ctrl+C in each window to stop individual services
echo ========================================================================
echo.

REM Check if node_modules exist, if not install dependencies
if not exist "backend\node_modules" (
    echo [1/3] Installing hotel backend dependencies...
    cd backend
    call npm install --legacy-peer-deps
    cd ..
)

if not exist "hospital-system\node_modules" (
    echo [2/3] Installing hospital backend dependencies...
    cd hospital-system
    call npm install --legacy-peer-deps
    cd ..
)

if not exist "frontend\node_modules" (
    echo [3/3] Installing frontend dependencies...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
)

echo.
echo Starting all services in dev mode...
echo.

REM Start Hotel Backend in a new window (using direct ts-node execution)
echo Starting Hotel Backend on port 5000...
start "Hotel Backend (Port 5000)" cmd /k "cd backend && npm start"

REM Start Hospital Backend in a new window (using dev mode)
echo Starting Hospital Backend on port 5001...
start "Hospital Backend (Port 5001)" cmd /k "cd hospital-system && npm run dev"

REM Start Frontend in a new window
echo Starting Frontend on port 3000...
start "Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================================
echo All services are starting in separate windows...
echo.
echo WAIT 30-60 seconds for services to initialize, then access:
echo   - Frontend:  http://localhost:3000
echo   - Hotel API: http://localhost:5000
echo   - Hospital API: http://localhost:5001
echo.
echo Service Windows:
echo   - Hotel Backend:    'Hotel Backend (Port 5000)'
echo   - Hospital Backend: 'Hospital Backend (Port 5001)'
echo   - Frontend:         'Frontend (Port 3000)'
echo.
echo To stop all services, close each window individually.
echo ========================================================================
echo.

endlocal
timeout /t 10
