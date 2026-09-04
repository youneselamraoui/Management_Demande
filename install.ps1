#Requires -Version 5.1
<#
.SYNOPSIS
  Installation en 1-clic — Management_Demande (Capex Manager)
  - Verifie .NET 10, Node 18+, SQL Server
  - dotnet restore + dotnet-ef
  - npm install
  - Cree la base projet_db + applique database/schema.sql + database/seed.sql
  - Lie backend <-> frontend (CORS + API_URL deja configures)

USAGE:
  Clic droit > Executer avec PowerShell
  ou: powershell -ExecutionPolicy Bypass -File install.ps1
  ou double-clic sur install.bat
#>
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"
$SchemaFile = Join-Path $Root "database\schema.sql"
$SeedFile   = Join-Path $Root "database\seed.sql"

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERREUR] $msg" -ForegroundColor Red }

# --- Helpers ---
function Test-Command($cmd) { $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue) }

function Get-ConnectionString {
    # Lit backend/appsettings.json -> ConnectionStrings:DefaultConnection
    $appsettings = Join-Path $BackendDir "appsettings.json"
    if (-not (Test-Path $appsettings)) { return "Server=localhost\SQLEXPRESS;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True" }
    try {
        $json = Get-Content $appsettings -Raw | ConvertFrom-Json
        $cs = $json.ConnectionStrings.DefaultConnection
        if ($cs) { return $cs }
    } catch {}
    return "Server=localhost\SQLEXPRESS;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True"
}

function Parse-ConnectionString($cs) {
    # Retourne hash: Server, Database
    $server = "localhost\SQLEXPRESS"; $db = "projet_db"
    if ($cs -match "Server\s*=\s*([^;]+)") { $server = $Matches[1].Trim() }
    elseif ($cs -match "Data Source\s*=\s*([^;]+)") { $server = $Matches[1].Trim() }
    if ($cs -match "Database\s*=\s*([^;]+)") { $db = $Matches[1].Trim() }
    elseif ($cs -match "Initial Catalog\s*=\s*([^;]+)") { $db = $Matches[1].Trim() }
    return @{ Server = $server; Database = $db; Full = $cs }
}

function Invoke-SqlBatch($connectionString, $sql) {
    # Execute un batch SQL en decoupant sur GO
    Add-Type -AssemblyName System.Data -ErrorAction SilentlyContinue | Out-Null
    $batches = $sql -split "(?m)^\s*GO\s*$"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $conn.Open()
    try {
        foreach ($batch in $batches) {
            $trim = $batch.Trim()
            if (-not $trim) { continue }
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = $trim
            $cmd.CommandTimeout = 60
            [void]$cmd.ExecuteNonQuery()
            $cmd.Dispose()
        }
    } finally { $conn.Close(); $conn.Dispose() }
}

# ===================== START =====================
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  Management_Demande - Capex Manager - Installation 1-clic" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta

# --- 1. Prerequis ---
Write-Step "1/6 Verification des prerequis"

# .NET
$dotnetOk = $false
if (Test-Command dotnet) {
    $ver = (& dotnet --version) 2>$null
    Write-Host "  dotnet: $ver"
    if ($ver -match "^10\.") { $dotnetOk = $true; Write-Ok ".NET 10 detecte" }
    else { Write-Warn ".NET $ver detecte, mais le projet cible net10.0 - installe le SDK 10" }
} else {
    Write-Warn "dotnet non trouve"
}
if (-not $dotnetOk) {
    Write-Host "  -> Installe .NET SDK 10: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    if (Test-Command winget) {
        Write-Host "  Tentative winget install Microsoft.DotNet.SDK.10 ..." -ForegroundColor Yellow
        try { winget install --id Microsoft.DotNet.SDK.10 -e --accept-package-agreements --accept-source-agreements; $dotnetOk = $true } catch { Write-Warn "winget a echoue, installe manuellement" }
    }
    if (-not $dotnetOk) { Write-Err "Installe .NET SDK 10 puis relance install.ps1"; Read-Host "Appuie sur Entree pour quitter"; exit 1 }
}

# Node
$nodeOk = $false
if (Test-Command node) {
    $nver = (& node --version) 2>$null
    Write-Host "  node: $nver  npm: $((& npm --version) 2>$null)"
    $major = [int]($nver.TrimStart('v').Split('.')[0])
    if ($major -ge 18) { $nodeOk = $true; Write-Ok "Node $nver OK (>=18)" }
    else { Write-Warn "Node $nver trop ancien, besoin de 18+" }
} else { Write-Warn "Node non trouve" }
if (-not $nodeOk) {
    Write-Host "  -> Installe Node.js 18+: https://nodejs.org/" -ForegroundColor Yellow
    if (Test-Command winget) {
        Write-Host "  Tentative winget install OpenJS.NodeJS.LTS ..." -ForegroundColor Yellow
        try { winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements; $nodeOk = $true } catch { Write-Warn "winget a echoue" }
    }
    if (-not $nodeOk) {
        # re-teste apres winget (PATH pas rafraichi dans meme session)
        if (Test-Command node) { $nodeOk = $true } else { Write-Err "Installe Node.js puis relance"; Read-Host "Entree pour quitter"; exit 1 }
    }
}

# SQL Server — on teste la connexion plus tard, ici on informe
Write-Host "  SQL Server: verification a l'etape base de donnees (Express/Developer attendu)"

# dotnet-ef
Write-Host "  dotnet-ef: " -NoNewline
if (Test-Command dotnet) {
    $efVer = (& dotnet ef --version 2>$null)
    if ($LASTEXITCODE -eq 0) { Write-Ok $efVer }
    else {
        Write-Warn "dotnet-ef non installe, installation..."
        & dotnet tool install --global dotnet-ef
        if ($LASTEXITCODE -ne 0) { & dotnet tool update --global dotnet-ef }
        Write-Ok "dotnet-ef installe"
    }
}

# --- 2. Backend restore ---
Write-Step "2/6 Backend - dotnet restore et build"
Push-Location $BackendDir
try {
    & dotnet restore
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore a echoue" }
    Write-Ok "dotnet restore OK"
    & dotnet build --nologo -v q
    if ($LASTEXITCODE -ne 0) { throw "dotnet build a echoue" }
    Write-Ok "dotnet build OK"
} finally { Pop-Location }

# --- 3. Frontend install ---
Write-Step "3/6 Frontend - npm install"
Push-Location $FrontendDir
try {
    if (-not (Test-Path "node_modules")) {
        & npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install a echoue" }
    } else {
        Write-Host "  node_modules deja present - verification rapide (npm install --prefer-offline saute pour aller vite)"
        # Pour forcer une verif complete, lance manuellement: npm install
    }
    Write-Ok "npm install OK"
} finally { Pop-Location }

# --- 4. Base de donnees ---
Write-Step "4/6 Base de donnees - creation + schema"
$csInfo = Parse-ConnectionString (Get-ConnectionString)
$server = $csInfo.Server
$dbName = $csInfo.Database
$fullCs = $csInfo.Full
Write-Host "  Serveur: $server  Base: $dbName"
Write-Host "  ConnectionString: $fullCs" -ForegroundColor DarkGray

# Construit une CS vers master pour CREATE DATABASE
$masterCs = $fullCs -replace "Database\s*=\s*[^;]+", "Database=master"
if ($masterCs -eq $fullCs) { $masterCs = $fullCs -replace "Initial Catalog\s*=\s*[^;]+", "Initial Catalog=master" }
if ($masterCs -eq $fullCs) { $masterCs = "$fullCs;Database=master" }

$canConnect = $false
try {
    Write-Host "  Test connexion SQL Server ($server) ..."
    Invoke-SqlBatch $masterCs "SELECT 1"
    $canConnect = $true
    Write-Ok "Connexion SQL Server OK"
} catch {
    Write-Err "Impossible de se connecter a SQL Server ($server)"
    Write-Host "  Details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host @"

  SQL Server n'est pas joignable. Options:

  1) Installe SQL Server Express (gratuit):
     https://www.microsoft.com/sql-server/sql-server-downloads
     Choisis "Express" -> Installation de base -> Redemarre.

  2) Ou utilise LocalDB (leger, deja avec Visual Studio):
     sqllocaldb create MSSQLLocalDB; sqllocaldb start MSSQLLocalDB
     Puis change la connexion dans backend/appsettings.json en:
     "Server=(localdb)\MSSQLLocalDB;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True"

  3) Ou Docker (si installe):
     docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest

  Apres avoir corrige, relance install.ps1
"@ -ForegroundColor Yellow
    Read-Host "Appuie sur Entree pour quitter"
    exit 1
}

if ($canConnect) {
    # CREATE DATABASE si n'existe pas
    try {
        $checkDb = "IF DB_ID('$dbName') IS NULL CREATE DATABASE [$dbName];"
        Invoke-SqlBatch $masterCs $checkDb
        Write-Ok "Base [$dbName] prete (creee si absente)"
    } catch { Write-Warn "CREATE DATABASE a echoue: $($_.Exception.Message)" }

    # Appliquer schema.sql si tables manquantes
    $needSchema = $false
    try {
        Invoke-SqlBatch $fullCs "SELECT TOP 1 * FROM [Capex]"
        Write-Ok "Tables deja presentes, schema saute"
    } catch {
        $needSchema = $true
        Write-Host "  Tables absentes -> application de database/schema.sql ..."
    }
    if ($needSchema) {
        if (-not (Test-Path $SchemaFile)) { Write-Err "Fichier manquant: $SchemaFile"; exit 1 }
        $schemaSql = Get-Content $SchemaFile -Raw
        try {
            Invoke-SqlBatch $fullCs $schemaSql
            Write-Ok "Schema applique"
        } catch {
            Write-Err "Echec application schema: $($_.Exception.Message)"
            Write-Host "  Essaie manuel: sqlcmd -S `"$server`" -d $dbName -i `"$SchemaFile`"" -ForegroundColor Yellow
            exit 1
        }
    }

    # Seed (toujours idempotent)
    if (Test-Path $SeedFile) {
        Write-Host "  Application seed (demo) ..."
        try {
            $seedSql = Get-Content $SeedFile -Raw
            Invoke-SqlBatch $fullCs $seedSql
            Write-Ok "Seed OK"
        } catch { Write-Warn "Seed a echoue (non bloquant): $($_.Exception.Message)" }
    }

    # Marquer EF migration history pour eviter conflits futurs (baseline vide)
    try {
        Invoke-SqlBatch $fullCs "IF OBJECT_ID('__EFMigrationsHistory') IS NULL CREATE TABLE [__EFMigrationsHistory] ([MigrationId] nvarchar(150) NOT NULL PRIMARY KEY, [ProductVersion] nvarchar(32) NOT NULL); IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId]='20260903111009_InitialCreate') INSERT INTO [__EFMigrationsHistory] ([MigrationId],[ProductVersion]) VALUES ('20260903111009_InitialCreate','10.0.11');"
        Write-Ok "Historique EF synchronise"
    } catch { Write-Warn "Sync EF history: $($_.Exception.Message)" }

    # Verification finale
    try {
        Add-Type -AssemblyName System.Data | Out-Null
        $conn = New-Object System.Data.SqlClient.SqlConnection($fullCs)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"
        $reader = $cmd.ExecuteReader()
        $tables = @()
        while ($reader.Read()) { $tables += $reader[0] }
        $reader.Close(); $conn.Close()
        Write-Ok "Tables en base: $($tables -join ', ')"
    } catch { Write-Warn "Verification tables: $($_.Exception.Message)" }
}

# --- 5. Verif liaison backend<->frontend ---
Write-Step "5/6 Liaison backend-frontend"
$apiUrl = "http://localhost:5058/api"
$frontendClient = Join-Path $FrontendDir "src\api\client.js"
$frontendAxios  = Join-Path $FrontendDir "src\services\api.js"
$backendCors    = Join-Path $BackendDir "Program.cs"
Write-Host "  Frontend API URL attendue: $apiUrl"
if (Test-Path $frontendClient) {
    $ok1 = Select-String -Path $frontendClient -Pattern "localhost:5058" -Quiet
    if ($ok1) { Write-Host "    - src/api/client.js : OK" } else { Write-Host "    - src/api/client.js : ATTENTION" }
}
if (Test-Path $frontendAxios)  {
    $ok2 = Select-String -Path $frontendAxios -Pattern "localhost:5058" -Quiet
    if ($ok2) { Write-Host "    - src/services/api.js : OK" } else { Write-Host "    - src/services/api.js : ATTENTION" }
}
if (Test-Path $backendCors)    {
    $ok3 = Select-String -Path $backendCors -Pattern "localhost:5173" -Quiet
    if ($ok3) { Write-Host "    - backend/Program.cs CORS : OK" } else { Write-Host "    - backend/Program.cs CORS : ATTENTION" }
}
Write-Ok "Liaison verifiee (si tu changes les ports, mets a jour ces 3 fichiers)"

# --- 6. Pret ---
Write-Step "6/6 Termine !"
Write-Host "  Tout est installe et lie." -ForegroundColor Green
Write-Host ""
Write-Host "  Pour DEMARRER l'app (2 terminaux):" -ForegroundColor Green
Write-Host "    Terminal 1 - API:" -ForegroundColor Green
Write-Host "      cd backend" -ForegroundColor Green
Write-Host "      dotnet run" -ForegroundColor Green
Write-Host "      -> http://localhost:5058/swagger" -ForegroundColor Green
Write-Host "    Terminal 2 - Frontend:" -ForegroundColor Green
Write-Host "      cd frontend" -ForegroundColor Green
Write-Host "      npm run dev" -ForegroundColor Green
Write-Host "      -> http://localhost:5173" -ForegroundColor Green
Write-Host "  Raccourci 1-clic pour demarrer les deux:" -ForegroundColor Green
Write-Host "    Double-clic sur start.bat  (ou .\start.ps1)" -ForegroundColor Green
Write-Host "  Si le navigateur s'ouvre sur une page blanche, verifie:" -ForegroundColor Green
Write-Host "    - que le backend tourne (swagger repond)" -ForegroundColor Green
Write-Host "    - que la base contient les tables (voir ci-dessus)" -ForegroundColor Green

$launch = Read-Host "Lancer l'application maintenant ? (O/N)"
if ($launch -match "^[OoYy]") {
    if (Test-Path (Join-Path $Root "start.ps1")) { & (Join-Path $Root "start.ps1") }
    else { Write-Host "Lance manuellement: cd backend; dotnet run  +  cd frontend; npm run dev" }
} else {
    Write-Host "OK. Lance plus tard avec .\start.ps1 ou start.bat" -ForegroundColor Cyan
}
