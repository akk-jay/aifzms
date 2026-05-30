$projectDir = "C:\Users\29542\Desktop\aifzms"

# Ensure Node.js is available
$env:Path = "C:\Program Files\nodejs;$env:APPDATA\npm;C:\Users\29542\AppData\Roaming\npm;$env:Path"
$env:Path = "$env:USERPROFILE\.cargo\bin;C:\mingw64\mingw64\bin;$env:Path"

Set-Location $projectDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Interview Assistant" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Stopping old processes..." -ForegroundColor Yellow
Get-Process -Name "aifzms" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Starting application..." -ForegroundColor Green
Write-Host "Keep this window open. Close it to stop the app." -ForegroundColor Gray
Write-Host ""

npm run tauri dev

Write-Host ""
Write-Host "App stopped." -ForegroundColor Red
Read-Host "Press Enter to close"
