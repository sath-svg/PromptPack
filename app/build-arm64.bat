@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64_arm64
cd /d "C:\Users\User\Documents\Repo\PromptPack\app"
call npm install
set PATH=%CD%\node_modules\.bin;%PATH%
npx @tauri-apps/cli build --target aarch64-pc-windows-msvc
if %ERRORLEVEL% neq 0 (
    echo Build failed with error code %ERRORLEVEL%
)
pause
