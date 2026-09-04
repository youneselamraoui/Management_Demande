# Database

- `schema.sql` — genere via `dotnet ef dbcontext script` (EF Core 10). Cree les 5 tables + FK + index. Idempotent si lance sur base vide.
- `seed.sql` — donnees demo (idempotent, `IF NOT EXISTS`).
- `init.sql` n'est pas necessaire: `install.ps1` cree la base `projet_db` et applique ces 2 fichiers via `System.Data.SqlClient`.

Regenerer le schema apres changement des entites:
```bash
cd backend
dotnet ef dbcontext script -o ../database/schema.sql
```
