@echo off
echo ======================================
echo    ITPC Complaint System - Start Server
echo ======================================
echo.
echo Getting your computer's IP address...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    echo   IP: %%a
)

echo.
echo ======================================
echo Starting server...
echo.
cd /d "%~dp0"
node server.js
pause