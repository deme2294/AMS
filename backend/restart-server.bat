@echo off
echo Checking for processes on port 5005...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5005 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5005...
    taskkill /F /PID %%a >nul 2>&1
)

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting server...
start "LMS Server" cmd /k "node server.js"
echo Server started on http://localhost:5011