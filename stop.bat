@echo off
title Stopping Servers...

echo Stopping FastAPI and React dev servers...

:: Kill uvicorn (FastAPI)
taskkill /FI "WINDOWTITLE eq FastAPI Backend" /T /F >nul 2>&1

:: Kill Vite (React)
taskkill /FI "WINDOWTITLE eq React Frontend" /T /F >nul 2>&1

:: Also kill any leftover python/node processes on those ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

echo Done. All servers stopped.
timeout /t 2 /nobreak >nul
