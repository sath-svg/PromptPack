@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" -arch=amd64
cd /d "C:\Users\User\Documents\Repo\PromptPack\app"
call npm install
set PATH=%CD%\node_modules\.bin;%PATH%
npx @tauri-apps/cli build
if %ERRORLEVEL% neq 0 (
    echo Build failed with error code %ERRORLEVEL%
)
pause
