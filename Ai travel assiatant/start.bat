@echo off
title TravelIQ - AI Travel Optimization Platform
color 0B

echo ============================================
echo   TravelIQ - AI Travel Platform Launcher
echo ============================================
echo.

:: Check MySQL
echo [1/4] Checking MySQL...
mysql -u root -pbatman -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo [WARN] MySQL may not be running or password may differ.
    echo        Make sure MySQL is running on port 3306
    echo        with user=root, password=batman, database=traveliq
    echo.
    pause
)
echo [OK] MySQL check done.
echo.

:: Start Backend
echo [2/4] Starting Backend (port 5000)...
start "TravelIQ Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 >nul

:: Start AI Service
echo [3/4] Starting AI Service (port 8000)...
start "TravelIQ AI Service" cmd /k "cd /d "%~dp0ai-services" && ..\.venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 >nul

:: Start Frontend
echo [4/4] Starting Frontend (port 5173)...
start "TravelIQ Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 5 >nul

echo.
echo ============================================
echo   All services started!
echo   Frontend:    http://localhost:5173
echo   Backend:     http://localhost:5000
echo   AI Service:  http://localhost:8000
echo ============================================
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://localhost:5173
