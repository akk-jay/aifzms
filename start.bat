@echo off
cd /d "%~dp0"

echo Killing old processes...
taskkill /f /im aifzms.exe >nul 2>&1
npx kill-port 1420 >nul 2>&1

echo.
echo Starting AI Interview Assistant...
echo.

call npm run tauri dev

if %errorlevel% neq 0 (
    echo.
    echo Startup failed! Check if Node.js and Rust are installed.
    pause
)
