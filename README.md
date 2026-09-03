# Management_Demande – Capex Manager

Application de gestion des demandes d'achat (Capex) : liste des demandes, suivi Capex, création de nouvelles demandes avec articles/détails.

Monorepo composé de :
- **backend/** — API ASP.NET Core (C#), SQL Server (migration en cours de ADO.NET vers EF Core)
- **frontend/** — Application React (Vite)

## Prérequis

- [.NET SDK 9.0+](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) et npm
- SQL Server (Express suffit) avec authentification Windows
- Outil `dotnet-ef` (pour les migrations EF Core) :
  ```bash
  dotnet tool install --global dotnet-ef
  ```

## Structure du projet

```
Management_Demande/
├── backend/
│   ├── Controllers/
│   ├── Data/
│   │   ├── EfModels/        # Entités EF Core
│   │   ├── Migrations/
│   │   └── Repositories/    # Repositories ADO.NET (legacy)
│   ├── DTOs/
│   ├── Models/
│   ├── Services/
│   └── appsettings.json
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── services/
    │   └── views/
    └── package.json
```

## Installation

### 1. Cloner le repo

```bash
git clone <url-du-repo>
cd Management_Demande
```

### 2. Backend

```bash
cd backend
dotnet restore
```

Configurer la chaîne de connexion dans `appsettings.Development.json` (créer le fichier s'il n'existe pas, il est ignoré par git) :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=projet_db;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

> Adapter `Server=` selon ton instance locale (ex. `localhost` si SQL Server par défaut, `localhost\\SQLEXPRESS` si Express).

Créer la base et appliquer les migrations EF Core :

```bash
dotnet ef database update
```

Lancer l'API :

```bash
dotnet run
```

L'API démarre par défaut sur les ports définis dans `Properties/launchSettings.json`. Swagger/OpenAPI est disponible sur `/swagger` (ou `/openapi` selon la config).

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

## Notes

- Le CORS du backend est configuré pour n'accepter que `http://localhost:5173` — adapter la policy CORS dans `Program.cs` si le frontend tourne sur un autre port.
- Le backend est en cours de migration de l'accès aux données via ADO.NET brut vers Entity Framework Core : certains Services utilisent encore l'ancien pattern Repository/ADO.NET, d'autres ont déjà basculé sur `ProjetDbContext` (EF Core).
- Fichiers sensibles (`appsettings.Development.json`, `.env`) ne sont pas versionnés — à créer localement à partir des exemples ci-dessus.

## Scripts utiles

| Commande | Description |
|---|---|
| `dotnet ef migrations add <Nom>` | Créer une nouvelle migration EF Core |
| `dotnet ef database update` | Appliquer les migrations à la base |
| `dotnet watch run` | Lancer l'API avec hot reload |
| `npm run build` | Build de production du frontend |
| `npm run lint` | Lint du frontend (ESLint) |
