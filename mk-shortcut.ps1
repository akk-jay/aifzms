$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcut = $ws.CreateShortcut("$desktop\AI_Interview.lnk")
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = '-ExecutionPolicy Bypass -NoLogo -File "C:\Users\29542\Desktop\aifzms\start.ps1"'
$shortcut.WorkingDirectory = "C:\Users\29542\Desktop\aifzms"
$shortcut.IconLocation = "powershell.exe,0"
$shortcut.Save()
Write-Host "Shortcut: AI_Interview.lnk -> $desktop"
