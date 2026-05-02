@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" -arch=amd64

set DEV_EXE=%~dp0src-tauri\target\debug\promptpack.exe
set PROD_EXE=C:\Users\User\AppData\Local\PromptPack\promptpack.exe
set REG_KEY=HKCU\SOFTWARE\Classes\promptpack\shell\open\command

echo [dev] Pointing promptpack:// deep link to dev build...
reg add "%REG_KEY%" /ve /d "\"%DEV_EXE%\" \"%%1\"" /f >nul

REM Trap Ctrl+C / exit so registry always restores
powershell -NoProfile -Command "try { npx tauri dev } finally { reg add '%REG_KEY%' /ve /d '\"%PROD_EXE%\" \"%%1\"' /f | Out-Null; Write-Host '[dev] Restored deep link to production build.' }"
