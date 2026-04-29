@echo off
title Dashboard Monitoring - Dev Server

echo ============================================
echo  Dashboard Monitoring - Starting Servers...
echo ============================================
echo.

:: Start FastAPI in background (minimized window)
echo [1/2] Starting FastAPI backend on port 8000...
start "FastAPI Backend" /min cmd /k "cd /d "%~dp0" && .\DashboardMonitoring\Scripts\python.exe -m uvicorn DashboardMonitoring.main:app --reload --port 8000"

:: Wait 2 seconds for FastAPI to initialize
timeout /t 2 /nobreak >nul

:: Start React dev server
echo [2/2] Starting React frontend on port 5173...
start "React Frontend" /min cmd /k "cd /d "%~dp0react-app" && npm run dev"

echo.
echo ============================================
echo  Both servers are starting up!
echo  - FastAPI : http://localhost:8000
echo  - React   : http://localhost:5173
echo ============================================
echo.
echo Close the minimized terminal windows to stop the servers.
pause
