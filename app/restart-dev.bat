@echo off
REM Skillset desktop — clean restart of Tauri dev server
REM Kills stale tauri/vite, clears Vite cache, rebuilds CSS + assets

setlocal
cd /d "%~dp0"

echo [1/4] Killing stale dev processes...
taskkill /F /IM "Skillset.exe" 2>nul
taskkill /F /IM "PromptPack.exe" 2>nul
taskkill /F /IM "tauri.exe" 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":1420" ^| findstr "LISTENING"') do taskkill /F /PID %%a 2>nul

echo [2/4] Clearing Vite cache...
if exist "node_modules\.vite" rmdir /S /Q "node_modules\.vite"
if exist "dist" rmdir /S /Q "dist"

echo [3/4] Ensuring deps installed...
if not exist "node_modules" call npm install

echo [4/4] Launching tauri dev...
call npm run tauri:dev

endlocal
