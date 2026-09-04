# Lance backend + frontend dans 2 fenetres separees
$Root = $PSScriptRoot
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"

Write-Host "Demarrage Capex Manager..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$BackendDir'; Write-Host 'API -> http://localhost:5058/swagger' -ForegroundColor Green; dotnet run"
# Frontend — petite attente pour laisser le temps au backend de demarrer
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$FrontendDir'; Write-Host 'Frontend -> http://localhost:5173' -ForegroundColor Green; npm run dev"

Write-Host "Deux fenetres ouvertes. Si le navigateur ne s'ouvre pas:" -ForegroundColor Yellow
Write-Host "  Backend : http://localhost:5058/swagger"
Write-Host "  Frontend: http://localhost:5173"
Start-Sleep -Seconds 1
try { Start-Process "http://localhost:5173" } catch {}
