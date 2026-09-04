#Requires -Version 5.1
<# 
  Build l'app en un seul exe — comme dotnet-sdk-10.0.400-win-x64 ou VisualStudioSetup

  Resultat :
    publish/CapexManager.exe  ~150 Mo self-contained, sans besoin de dotnet/node/sqlserver
    CapexManager-Setup.exe    installateur Windows (si Inno Setup installe)

  Usage : clic droit > Executer avec PowerShell ou: powershell -ExecutionPolicy Bypass -File build-app.ps1
#>
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$FrontendDir = Join-Path $Root "frontend"
$BackendDir  = Join-Path $Root "backend"
$PublishDir  = Join-Path $BackendDir "publish"

Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  Capex Manager - Build Single App" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta

# 1. Frontend build
Write-Host "`n[1/3] Frontend build (vite)..." -ForegroundColor Cyan
Push-Location $FrontendDir
try {
  if (-not (Test-Path "node_modules")) { & npm install; if($LASTEXITCODE -ne 0){throw "npm install failed"} }
  & npm run build
  if($LASTEXITCODE -ne 0){throw "vite build failed"}
  Write-Host "[OK] frontend/dist genere" -ForegroundColor Green
} finally { Pop-Location }

# 2. Copie wwwroot pour que le backend serve le frontend
Write-Host "`n[2/3] Copie frontend/dist -> backend/wwwroot..." -ForegroundColor Cyan
$wwwroot = Join-Path $BackendDir "wwwroot"
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
Copy-Item (Join-Path $FrontendDir "dist\*") $wwwroot -Recurse -Force
Write-Host "[OK] wwwroot pret ($((Get-ChildItem $wwwroot -Recurse | Measure-Object).Count) fichiers)" -ForegroundColor Green

# 3. Publish single-file
Write-Host "`n[3/3] Publish single-file (win-x64, self-contained)..." -ForegroundColor Cyan
# Cleanup ancien publish
if (Test-Path $PublishDir) { Remove-Item $PublishDir -Recurse -Force }
Push-Location $BackendDir
try {
  # Info version dotnet
  & dotnet --version | Write-Host
  # Publish Release win-x64 single file
  $args = @("publish","-c","Release","-r","win-x64","--self-contained","true","/p:PublishSingleFile=true","/p:IncludeNativeLibrariesForSelfExtract=true","/p:EnableCompressionInSingleFile=true","-o", $PublishDir)
  Write-Host "  dotnet $($args -join ' ')" -ForegroundColor DarkGray
  & dotnet @args
  if($LASTEXITCODE -ne 0){ throw "dotnet publish failed" }
  # Copie capex.db vide si besoin? non, l'app le cree au premier lancement (SQLite fallback)
  # Ajoute un README dans publish
  @"
Capex Manager - App portable
============================
Lancez CapexManager.exe et ouvrez http://localhost:5000

- Pas besoin de dotnet, node, sql server
- Base SQLite capex.db creee automatiquement a cote de l'exe si SQL Server absent
- Si SQL Server SQLEXPRESS est installe, l'app l'utilise automatiquement (projet_db)
"@ | Set-Content (Join-Path $PublishDir "LisezMoi.txt") -Encoding UTF8

  $exe = Join-Path $PublishDir "CapexManager.exe"
  $size = (Get-Item $exe).Length / 1MB
  Write-Host "`n[OK] Publish termine !" -ForegroundColor Green
  Write-Host "  -> $exe ($([math]::Round($size,1)) Mo)" -ForegroundColor Yellow
  Write-Host "  Lancez-le: & `"$exe`"  puis ouvrez http://localhost:5000" -ForegroundColor Cyan
} finally { Pop-Location }

# 4. Optionnel : Creer l'installateur Windows (comme go1.27.0.windows-amd64.msi / Setup.exe)
$iss = Join-Path $Root "installer.iss"
if (Test-Path $iss) {
  $iscc = @("C:\Program Files (x86)\Inno Setup 6\ISCC.exe","C:\Program Files\Inno Setup 6\ISCC.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($iscc) {
    Write-Host "`n[4/4] Creation installateur (Inno Setup)..." -ForegroundColor Cyan
    & $iscc $iss
    if($LASTEXITCODE -eq 0){ Write-Host "[OK] Setup genere dans Output/" -ForegroundColor Green } else { Write-Host "[WARN] ISCC failed" -ForegroundColor Yellow }
  } else {
    Write-Host "`n[INFO] Inno Setup non installe - installateur non genere." -ForegroundColor Yellow
    Write-Host "  Pour obtenir CapexManager-Setup.exe comme dans ta capture:" -ForegroundColor Yellow
    Write-Host "  1) Installe Inno Setup 6: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    Write-Host "  2) Relance build-app.ps1 (ou: ISCC.exe installer.iss)" -ForegroundColor Yellow
  }
}

# 5. Archive zip portable (alternative au Setup.exe)
$zip = Join-Path $Root "CapexManager-portable-win-x64.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$PublishDir\*" -DestinationPath $zip -Force
Write-Host "`n[OK] Archive portable: $zip ($([math]::Round((Get-Item $zip).Length/1MB,1)) Mo)" -ForegroundColor Green
Write-Host "`nTermine. Distribue l'un de ces fichiers (comme dotnet-sdk-..exe):" -ForegroundColor Magenta
Write-Host "  - $PublishDir\CapexManager.exe         (1 seul exe, clic pour run)" -ForegroundColor White
Write-Host "  - $zip   (dezip + run exe)" -ForegroundColor White
if (Test-Path (Join-Path $Root "Output\CapexManager-Setup.exe")) { Write-Host "  - Output\CapexManager-Setup.exe           (installateur Windows)" -ForegroundColor White }
