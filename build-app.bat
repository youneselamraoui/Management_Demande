@echo off
REM Build 1-clic de l'app unique — double-clic
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-app.ps1"
pause
