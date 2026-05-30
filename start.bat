@echo off
chcp 65001 >nul 2>&1
cd /d "C:\Users\29542\Desktop\aifzms"

echo ==========================================
echo   AI Interview Assistant - Starting...
echo ==========================================
echo.

echo [1/3] Stopping old processes...
taskkill /f /im aifzms.exe >nul 2>&1

echo [2/3] Clearing port 1420...
npx kill-port 1420 >nul 2>&1

echo [3/3] Launching application...
echo.
echo   The app will open in a new window.
echo   Keep this window open while using the app.
echo   Press Ctrl+C in this window to stop.
echo ==========================================

npm run tauri dev

pause
