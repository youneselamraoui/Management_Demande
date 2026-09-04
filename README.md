# Management_Demande — Capex Manager

Application de gestion des demandes d'achat (Capex) : création de demandes, suivi budgétaire par Capex, consommation par département, et dashboard.

Monorepo composé de :
- **backend/** — API ASP.NET Core 10.0 (C#) + Entity Framework Core 10 + SQL Server / SQLite
- **frontend/** — SPA React 19 + Vite 8 + Tailwind CSS 4 + Axios

## Mode Single-App (comme `dotnet-sdk-10.0.400-win-x64.exe` ou `go1.27.0.windows-amd64.msi`)

> **Un seul fichier pour run — sans copier le code, sans installer dotnet/node/sqlserver.**

### Telecharger et lancer (utilisateur final)

| Fichier | Taille | Usage |
|---|---|---|
| `CapexManager.exe` | ~54 Mo | **1 seul exe portable** — double-clic → app sur `http://localhost:5000` |
| `CapexManager-portable-win-x64.zip` | ~50 Mo | Dezip + double-clic `CapexManager.exe` |
| `CapexManager-Setup.exe` | ~55 Mo | Installateur Windows (Inno Setup) — installe dans `Program Files` + raccourci bureau/Start Menu |

```
CapexManager.exe  (double-clic)
  -> Frontend servi sur http://localhost:5000
  -> API sur        http://localhost:5000/api
  -> Swagger sur    http://localhost:5000/swagger (en Development)
  -> Base creee automatiquement:
       - si SQL Server SQLEXPRESS detecte -> utilise projet_db (SQL Server)
       - sinon -> cree capex.db (SQLite) a cote de l'exe, sans rien installer
```

**Aucun prerequis** : pas besoin de `.NET SDK`, `Node`, `SQL Server` — tout est embarque (self-contained `win-x64`).

### Construire l'app unique (developpeur)

```bash
# Option 1 : 1-clic Windows
build-app.bat          # ou: powershell -ExecutionPolicy Bypass -File build-app.ps1

# Option 2 : manuel
cd frontend && npm run build          # -> dist/
cd ../backend && dotnet publish -c Release -r win-x64 --self-contained true -o publish
# Resultat : backend/publish/CapexManager.exe  (+ wwwroot embarque)
```

**Ce que fait `build-app.ps1` :**
1. `npm run build` dans `frontend/` → `dist/`
2. Copie `frontend/dist` → `backend/wwwroot` (servi via `UseStaticFiles` + `MapFallbackToFile("index.html")` dans `backend/Program.cs:119-129`)
3. `dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true` → `backend/publish/CapexManager.exe`
4. Genere `CapexManager-portable-win-x64.zip` (portable)
5. Si Inno Setup 6 installe (`iscc.exe`), genere `Output/CapexManager-Setup.exe` via `installer.iss` (comme `VisualStudioSetup` / `go` installer)

**Details techniques single-app :**
- `backend/backend.csproj:8-17` : `PublishSingleFile`, `SelfContained`, `RuntimeIdentifier=win-x64`, `IncludeNativeLibrariesForSelfExtract`, `AssemblyName=CapexManager`
- `frontend/src/api/client.js:1` + `frontend/src/services/api.js:4` : `import.meta.env.PROD ? "/api" : "http://localhost:5058/api"` → en prod, meme origine (pas de CORS)
- `backend/Program.cs:8-14` : `WebApplicationOptions { ContentRootPath = AppContext.BaseDirectory }` pour que l'exe trouve `wwwroot` meme si lance depuis un autre dossier
- `backend/Program.cs:30-62` : probe `SqlConnection` → si SQL Server joignable utilise `UseSqlServer`, sinon fallback `UseSqlite("Data Source=capex.db")` → **app portable sans SQL Server**
- `backend/Program.cs:73-110` : `EnsureCreated()` + seed automatique au premier lancement (plus besoin de `dotnet ef database update`)
- `backend/Data/ProjetDbContext.cs:40` : retrait du `HasDefaultValueSql("(getdate())")` pour compatibilite SQLite + `CreateAt = DateTime.UtcNow` dans `Services/DemandeService.cs:69`
- `backend/appsettings.json:3-4` : ajout `SqliteConnection` + `UseSqliteFallback`

### Installer Inno Setup (pour generer le Setup.exe comme ta capture)

1. Telecharge Inno Setup 6 : https://jrsoftware.org/isdl.php
2. Installe (defaut `C:\Program Files (x86)\Inno Setup 6\`)
3. `ISCC.exe installer.iss` ou relance `build-app.ps1`

`installer.iss` installe `backend/publish/*` dans `{autopf}\CapexManager`, cree raccourci bureau + Start Menu, lance `CapexManager.exe` a la fin.

---

## Installation en 1-clic depuis le code source (dev)

> Pour developper / contribuer — clone + `install.bat` comme avant.

```bash
git clone https://github.com/youneselamraoui/Management_Demande.git
cd Management_Demande
# double-clic sur install.bat  OU  clic droit > Executer avec PowerShell sur install.ps1
```

| Fichier | Action |
|---|---|
| `install.bat` | **Double-clic** — lance `install.ps1` (compatible CMD) |
| `install.ps1` | Installe tout : `dotnet restore`, `npm install`, cree la base `projet_db`, applique `database/schema.sql` + `database/seed.sql`, verifie la liaison backend/frontend |
| `start.bat` / `start.ps1` | **Double-clic** apres install — ouvre 2 fenetres (API + Vite) |
| `database/schema.sql` | Schema complet genere via `dotnet ef dbcontext script` (5 tables + FK + index) |
| `database/seed.sql` | Donnees demo idempotentes (Departements, Utilisateurs, Capex) |

**Ce que fait `install.ps1` en detail :**
1. Verifie `.NET 10` (`backend/backend.csproj:3`), `Node 18+`, `dotnet-ef` (tente `winget` si manquant)
2. `dotnet restore` + `dotnet build` dans `backend/`
3. `npm install` dans `frontend/` (saute si `node_modules` existe)
4. Cree la base `projet_db` (via `master`) si absente, applique `database/schema.sql` si tables manquantes, applique `database/seed.sql` (idempotent), synchronise `__EFMigrationsHistory` avec `20260903111009_InitialCreate`
5. Verifie que `frontend/src/api/client.js:1` + `frontend/src/services/api.js:4` pointent sur `http://localhost:5058/api` et que `backend/Program.cs:24` autorise `http://localhost:5173`
6. Propose de lancer `start.ps1`

Apres install, l'app est liee et prete :

```bash
# Option A : 1-clic
.\start.bat

# Option B : manuel (2 terminaux)
cd backend && dotnet run      # -> http://localhost:5058/swagger
cd frontend && npm run dev    # -> http://localhost:5173
```

---

## Sommaire

- [Prérequis (PC neuf)](#prérequis-pc-neuf)
- [Installation — de zéro au premier run](#installation--de-zéro-au-premier-run)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Lancer l'application](#lancer-lapplication)
- [Vérifier que tout fonctionne](#vérifier-que-tout-fonctionne)
- [Structure du projet](#structure-du-projet)
- [Scripts utiles](#scripts-utiles)
- [Dépannage](#dépannage)

---

## Prérequis (PC neuf)

Installe ces outils **dans l'ordre** sur un Windows neuf :

| Outil | Version requise | Lien | Vérification |
|---|---|---|---|
| **Git** | dernière | https://git-scm.com/download/win | `git --version` |
| **.NET SDK** | **10.0.x** (le projet cible `net10.0` — cf. `backend/backend.csproj:3`) | https://dotnet.microsoft.com/download | `dotnet --version` → doit afficher `10.x` |
| **Node.js** | **18+** (testé en 24.x) | https://nodejs.org/ | `node --version` + `npm --version` |
| **SQL Server** | 2019 / 2022 / Express / Developer | https://www.microsoft.com/sql-server/sql-server-downloads | `sqlcmd` ou SSMS |
| **SSMS** (recommandé) | dernière | https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms | — |
| **dotnet-ef** (CLI EF Core) | 10.0.11 | voir ci-dessous | `dotnet ef --version` |

> **Important — .NET 10 :** le `TargetFramework` est `net10.0` (`backend/backend.csproj:3`). Le SDK 9 ne suffit pas, le build échouera avec `NETSDK1045`.

Installation de l'outil EF Core (une seule fois) :
```bash
dotnet tool install --global dotnet-ef
# si déjà installé :
dotnet tool update --global dotnet-ef
```

---

## Installation — de zéro au premier run

### 1. Cloner le projet

```bash
git clone https://github.com/youneselamraoui/Management_Demande.git
cd Management_Demande
```

### 2. Backend — restaurer les dépendances

```bash
cd backend
dotnet restore
```

Cela installe les packages listés dans `backend/backend.csproj:10-24` : `Microsoft.EntityFrameworkCore.SqlServer`, `Swashbuckle.AspNetCore`, `DotNetEnv`, etc.

### 3. SQL Server — créer l'instance et la base

#### a) Installer SQL Server

- Choisis **Express** ou **Developer** lors de l'installation.
- Active l'**authentification Windows** (par défaut).
- Note le nom d'instance :
  - `localhost\SQLEXPRESS` si tu as installé Express
  - `localhost` si instance par défaut (Developer)

#### b) Créer la base `projet_db`

Ouvre **SSMS** ou `sqlcmd` et exécute :

```sql
CREATE DATABASE projet_db;
GO
```

> Le nom `projet_db` est celui attendu par `backend/appsettings.json:3`.

#### c) Configurer la chaîne de connexion

Le fichier par défaut est `backend/appsettings.json:2-4` :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

- Si ton instance est `localhost` (sans `\SQLEXPRESS`), modifie `Server=` en conséquence.
- Pour ne **pas** committer tes secrets locaux, crée `backend/appsettings.Development.json` (ignoré par git) qui surcharge la connexion :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> `backend/appsettings.Development.json` actuel (`backend/appsettings.Development.json:1-8`) ne contient que du Logging — tu peux y ajouter `ConnectionStrings` comme ci-dessus.

Alternative : User Secrets (recommandé pour un poste partagé) :
```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost\\SQLEXPRESS;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True"
```

### 4. Base de données — appliquer les migrations

```bash
# depuis backend/
dotnet ef database update
```

> **Attention :** la migration `20260903111009_InitialCreate` (`backend/Data/Migrations/20260903111009_InitialCreate.cs:13-15`) est une **baseline vide** (`Up()` ne fait rien). Elle ne crée **aucune table**. Elle sert uniquement à marquer que le schéma existe déjà en base.
>
> **Sur un PC neuf avec une base vide, tu as 2 options :**
> 1. **Importer un backup / script SQL** de la base existante (tables `Capex`, `Demande`, `DetailDemande`, `Departement`, `Utilisateur`) si tu en as un.
> 2. **Générer les tables via EF** en supprimant la migration baseline et en la recréant :
>    ```bash
>    dotnet ef migrations remove
>    dotnet ef migrations add InitialCreate
>    dotnet ef database update
>    ```
>    (à faire seulement si tu pars d'une base vide et que les entités EF dans `backend/Data/EfModels/` sont à jour)

Vérifie que les tables existent :
```sql
USE projet_db;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';
-- attendu : Capex, Demande, DetailDemande, Departement, Utilisateur, __EFMigrationsHistory
```

### 5. Frontend — installer les dépendances

```bash
cd ../frontend
npm install
```

Cela installe les dépendances de `frontend/package.json:12-30` (React 19, Vite 8, Tailwind 4, Axios, etc.).

Aucun fichier `.env` n'est requis actuellement : l'URL de l'API est hardcodée dans `frontend/src/api/client.js:1` et `frontend/src/services/api.js:4` à `http://localhost:5058/api`.

> Si tu changes le port du backend, mets à jour ces 2 fichiers **et** la policy CORS dans `backend/Program.cs:24`.

---

## Lancer l'application

Il faut **2 terminaux** (backend + frontend).

### Terminal 1 — Backend (API)

```bash
cd backend
dotnet run
# ou avec hot reload :
dotnet watch run
```

- Profil `http` : `http://localhost:5058` (`backend/Properties/launchSettings.json:8`)
- Profil `https` : `https://localhost:7169` + `http://localhost:5058` (`backend/Properties/launchSettings.json:17`)
- Swagger UI : `http://localhost:5058/swagger` (uniquement en `Development`, cf. `backend/Program.cs:43-48`)
- OpenAPI JSON : `http://localhost:5058/openapi`

### Terminal 2 — Frontend (Vite)

```bash
cd frontend
npm run dev
```

- URL : `http://localhost:5173`
- Le frontend appelle l'API sur `http://localhost:5058/api` — le backend doit être lancé en premier.

---

## Vérifier que tout fonctionne

1. **Backend seul :** ouvre `http://localhost:5058/swagger` → tu dois voir les contrôleurs `Capex`, `Demandes`, `Departements`, `DetailDemande`, `Utilisateurs` (`backend/Controllers/`).
2. **Frontend seul :** ouvre `http://localhost:5173` → Dashboard s'affiche.
3. **Intégration :** crée une demande depuis le frontend → vérifie qu'elle apparaît en base :
   ```sql
   SELECT TOP 5 * FROM Demande ORDER BY CreateAt DESC;
   ```

---

## Configuration

| Fichier | Rôle | Versionné ? |
|---|---|---|
| `backend/appsettings.json` | Connexion par défaut + Logging | Oui |
| `backend/appsettings.Development.json` | Surcharges locales (connexion, logs) | Non (à créer) |
| `backend/Properties/launchSettings.json` | Ports 5058/7169 + `ASPNETCORE_ENVIRONMENT` | Oui |
| `frontend/src/api/client.js:1` | `API_URL = http://localhost:5058/api` | Oui |
| `frontend/src/services/api.js:4` | `baseURL: http://localhost:5058/api` | Oui |

### CORS

Le backend n'autorise que `http://localhost:5173` (`backend/Program.cs:20-28`) :
```csharp
policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod();
```
Si le frontend tourne sur un autre port/hôte, ajoute l'origine dans cette policy.

### Certificat HTTPS (optionnel)

Si `dotnet run` affiche une erreur de certificat HTTPS :
```bash
dotnet dev-certs https --trust
```

---

## Base de données

### Modèle EF Core

Contexte : `backend/Data/ProjetDbContext.cs:8` — `ProjetDbContext`

Entités (`backend/Data/EfModels/`) :
- `Capex` (`CapexId`, `NomCapex`, `BudgetTotal`, `ResteBudget`)
- `Demande` (`IdDemande`, `UtilisateurId`, `CapexId`, `Statut`, `Rfx`, `CreateAt`, dates de validation)
- `DetailDemande` (`Id`, `DemandeId`, ...)
- `Departement` (`Id`, ...)
- `Utilisateur` (`Id`, `DepartementId`, ...)

Relations configurées dans `ProjetDbContext.OnModelCreating` (`backend/Data/ProjetDbContext.cs:29-78`).

### Repositories legacy

Le dossier `backend/Data/Repositories/` contient des repositories ADO.NET (`CapexRepository.cs`, `DemandeRepository.cs`, etc.) **non utilisés** : tous les services sont désormais sur EF Core (`backend/Program.cs:35-39`).

---

## Structure du projet

```
Management_Demande/
├── backend/
│   ├── Controllers/          # 5 contrôleurs API (Capex, Demandes, Departements, DetailDemande, Utilisateurs)
│   ├── Data/
│   │   ├── EfModels/         # Entités EF Core (Capex, Demande, DetailDemande, Departement, Utilisateur)
│   │   ├── Migrations/       # Migrations EF Core (InitialCreate = baseline vide)
│   │   ├── Repositories/     # Repositories ADO.NET legacy (non utilisés)
│   │   ├── ProjetDbContext.cs
│   │   └── DbConnectionFactory.cs
│   ├── DTOs/
│   ├── Models/               # Enums (StatutDemande, ...)
│   ├── Services/             # Logique métier (5 services sur EF Core)
│   ├── Properties/launchSettings.json  # Ports 5058 / 7169
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   └── backend.csproj        # TargetFramework net10.0
└── frontend/
    ├── src/
    │   ├── api/client.js     # fetch wrapper (API_URL hardcodée)
    │   ├── services/api.js   # instance Axios (baseURL hardcodée)
    │   ├── views/            # Dashboard, DemandesPage, SuiviCapex
    │   ├── components/
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js        # plugins react + tailwindcss
    ├── index.html
    └── package.json
```

---

## Scripts utiles

### Backend

| Commande | Description |
|---|---|
| `dotnet restore` | Restaure les packages NuGet |
| `dotnet build` | Compile le projet |
| `dotnet run` | Lance l'API (http://localhost:5058) |
| `dotnet watch run` | Lance avec hot reload |
| `dotnet ef migrations add <Nom>` | Crée une nouvelle migration |
| `dotnet ef migrations remove` | Supprime la dernière migration |
| `dotnet ef database update` | Applique les migrations à la base |
| `dotnet ef database drop` | Supprime la base (dangereux) |

### Frontend

| Commande | Description |
|---|---|
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur Vite (http://localhost:5173) |
| `npm run build` | Build de production → `dist/` |
| `npm run preview` | Prévisualise le build de prod |
| `npm run lint` | Lint ESLint |

---

## Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| `NETSDK1045: ... net10.0 ...` | SDK .NET 10 non installé | Installe le SDK 10.0 : `dotnet --version` doit afficher `10.x` |
| `Login failed for user` / `Cannot open database "projet_db"` | SQL Server non démarré ou base inexistante | Vérifie que SQL Server tourne (services.msc → `SQL Server (SQLEXPRESS)`) et `CREATE DATABASE projet_db` |
| `A network-related or instance-specific error` | Mauvais `Server=` | Teste `localhost` vs `localhost\SQLEXPRESS` ; vérifie avec `sqlcmd -S localhost\SQLEXPRESS -Q "SELECT @@VERSION"` |
| `dotnet ef: command not found` | `dotnet-ef` non installé | `dotnet tool install --global dotnet-ef` puis rouvre le terminal |
| `Failed to fetch` côté frontend | Backend non lancé ou CORS | Vérifie que `http://localhost:5058/swagger` répond ; vérifie `backend/Program.cs:24` |
| Page blanche Vite | `npm install` non fait | `cd frontend && npm install && npm run dev` |
| `ERR_CERT_AUTHORITY_INVALID` sur https | Certificat dev non trusté | `dotnet dev-certs https --trust` |
| Base vide après `database update` | Migration baseline vide | Voir section [Base de données](#base-de-données) — importer un dump ou recréer la migration |

---

## Prérequis récapitulatif pour un PC neuf (checklist)

- [ ] Git installé
- [ ] .NET SDK 10.0 installé (`dotnet --version` → `10.x`)
- [ ] `dotnet-ef` installé (`dotnet ef --version` → `10.x`)
- [ ] Node.js 18+ installé (`node --version`)
- [ ] SQL Server installé et démarré
- [ ] Base `projet_db` créée
- [ ] `backend/appsettings.Development.json` configuré (ou `appsettings.json` adapté)
- [ ] `dotnet restore` OK dans `backend/`
- [ ] `dotnet ef database update` OK (ou dump importé)
- [ ] `dotnet run` → Swagger accessible sur `http://localhost:5058/swagger`
- [ ] `npm install` OK dans `frontend/`
- [ ] `npm run dev` → app accessible sur `http://localhost:5173`
