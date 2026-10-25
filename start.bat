@echo off
title EduTrack Launcher
echo ======================================================
echo   Starting EduTrack Attendance System
echo ======================================================
echo.
echo [1/2] Starting Backend Server (Port 5000)...
start "EduTrack Backend" cmd /k "cd backend && npm run dev"

echo Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Frontend Server (Vite)...
start "EduTrack Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================
echo   EduTrack is starting up!
echo   Frontend will open at: http://localhost:3000
echo   Backend is running at:  http://localhost:5000
echo ======================================================
pause
