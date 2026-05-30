$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut("$env:USERPROFILE\Desktop\AI面试助手.lnk")
$s.TargetPath = "$env:USERPROFILE\Desktop\aifzms\start.bat"
$s.WorkingDirectory = "$env:USERPROFILE\Desktop\aifzms"
$s.IconLocation = "shell32.dll,14"
$s.Save()
Write-Host "Desktop shortcut created: AI面试助手.lnk"
