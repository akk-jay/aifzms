@echo off
chcp 65001 >nul
cd /d "C:\Users\29542\Desktop\aifzms"
echo 🚀 启动 AI 面试助手...
npx kill-port 1420 >nul 2>&1
call npm run tauri dev
pause
