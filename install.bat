@echo off
REM Installateur 1-clic — double-clic pour installer tout
REM Lance install.ps1 avec bypass policy
setlocal
cd /d "%~dp0"
echo Lancement de l'installateur 1-clic...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
    echo.
    echo [ERREUR] Installation terminee avec des erreurs.
    pause
) else (
    pause
)
