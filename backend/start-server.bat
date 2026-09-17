@echo off
setlocal

echo Checking port 5005 usage...
rem Kill the process that is listening on port 5005 (Windows-safe + reliable)
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :5005 ^| findstr LISTENING') do (
  echo Stopping PID %%P on port 5005...
  powershell -Command "Stop-Process -Id %%P -Force -ErrorAction SilentlyContinue"
)

timeout /t 2 /nobreak >nul

echo Starting LMS Server (port 5005)...
cd /d "%~dp0"
start "LMS Server" cmd /k "node server.js"

echo Server started at http://localhost:5005
pause
