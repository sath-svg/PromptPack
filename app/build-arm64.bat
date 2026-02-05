@echo off
call C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat x64_arm64
cd /d C:\Users\User\Documents\Repo\PromptPack\app
npm run tauri build -- --target aarch64-pc-windows-msvc
