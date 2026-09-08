using backend.Services;
using backend.Services.Interfaces;
using backend.Data.EfModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
    WebRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot")
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- EF Core : SqlServer avec fallback SQLite pour mode single-app ---
var csSqlServer = builder.Configuration.GetConnectionString("DefaultConnection")!;
var csSqlite = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=capex.db";
var useFallback = builder.Configuration.GetValue<bool>("UseSqliteFallback", true);

bool sqlServerReachable = false;
if (!useFallback)
{
    sqlServerReachable = true;
}
else
{
    try
    {
        using var probe = new SqlConnection(csSqlServer);
        probe.Open();
        probe.Close();
        sqlServerReachable = true;
    }
    catch { sqlServerReachable = false; }
}

if (sqlServerReachable)
{
    builder.Services.AddDbContext<ProjetDbContext>(options => options.UseSqlServer(csSqlServer));
    Console.WriteLine($"[DB] SQL Server : {csSqlServer}");
}
else
{
    builder.Services.AddDbContext<ProjetDbContext>(options => options.UseSqlite(csSqlite));
    Console.WriteLine($"[DB] SQLite fallback : {csSqlite}");
}

builder.Services.AddScoped<IDepartementService, DepartementService>();
builder.Services.AddScoped<IUtilisateurService, UtilisateurService>();
builder.Services.AddScoped<ICapexService, CapexService>();
builder.Services.AddScoped<IDemandeService, DemandeService>();
builder.Services.AddScoped<IDetailDemandeService, DetailDemandeService>();

var app = builder.Build();

// --- Migration renommage tables/colonnes (ancien -> nouveau) ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProjetDbContext>();
    try
    {
        if (sqlServerReachable)
        {
            // Renommage tables si anciennes existent
            var renameSql = @"
IF OBJECT_ID('Capex') IS NOT NULL AND OBJECT_ID('Capexes') IS NULL EXEC sp_rename 'Capex', 'Capexes';
IF OBJECT_ID('Demande') IS NOT NULL AND OBJECT_ID('Demandes') IS NULL EXEC sp_rename 'Demande', 'Demandes';
IF OBJECT_ID('DetailDemande') IS NOT NULL AND OBJECT_ID('DetailsDemandes') IS NULL EXEC sp_rename 'DetailDemande', 'DetailsDemandes';
IF OBJECT_ID('Departement') IS NOT NULL AND OBJECT_ID('Departements') IS NULL EXEC sp_rename 'Departement', 'Departements';
IF OBJECT_ID('Utilisateur') IS NOT NULL AND OBJECT_ID('Utilisateurs') IS NULL EXEC sp_rename 'Utilisateur', 'Utilisateurs';
-- Colonnes Demandes
IF COL_LENGTH('Demandes','idDemande') IS NOT NULL AND COL_LENGTH('Demandes','Id') IS NULL EXEC sp_rename 'Demandes.idDemande', 'Id', 'COLUMN';
IF COL_LENGTH('Demandes','RFx') IS NOT NULL AND COL_LENGTH('Demandes','RFX') IS NULL EXEC sp_rename 'Demandes.RFx', 'RFX', 'COLUMN';
IF COL_LENGTH('Demandes','CreateAt') IS NOT NULL AND COL_LENGTH('Demandes','CreatedAt') IS NULL EXEC sp_rename 'Demandes.CreateAt', 'CreatedAt', 'COLUMN';
IF COL_LENGTH('Demandes','DateValidation1') IS NOT NULL AND COL_LENGTH('Demandes','DateValidationAchat1') IS NULL EXEC sp_rename 'Demandes.DateValidation1', 'DateValidationAchat1', 'COLUMN';
IF COL_LENGTH('Demandes','DateValidation2') IS NOT NULL AND COL_LENGTH('Demandes','DateValidationAchat2') IS NULL EXEC sp_rename 'Demandes.DateValidation2', 'DateValidationAchat2', 'COLUMN';
-- Colonne Capexes
IF COL_LENGTH('Capexes','ResteBudget') IS NOT NULL AND COL_LENGTH('Capexes','BudgetRestant') IS NULL EXEC sp_rename 'Capexes.ResteBudget', 'BudgetRestant', 'COLUMN';
";
            try { db.Database.ExecuteSqlRaw(renameSql); Console.WriteLine("[DB] Renommage tables/colonnes verifie"); } catch (Exception ex) { Console.WriteLine($"[DB] Rename warning: {ex.Message}"); }
        }
        else
        {
            // SQLite : ALTER TABLE RENAME (si ancien schema)
            try
            {
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Capex RENAME TO Capexes"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Demande RENAME TO Demandes"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE DetailDemande RENAME TO DetailsDemandes"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Departement RENAME TO Departements"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Utilisateur RENAME TO Utilisateurs"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Demandes RENAME COLUMN idDemande TO Id"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Demandes RENAME COLUMN RFx TO RFX"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Demandes RENAME COLUMN CreateAt TO CreatedAt"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Demandes RENAME COLUMN DateValidation1 TO DateValidationAchat1"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Demandes RENAME COLUMN DateValidation2 TO DateValidationAchat2"); } catch {}
                try { db.Database.ExecuteSqlRaw("ALTER TABLE Capexes RENAME COLUMN ResteBudget TO BudgetRestant"); } catch {}
            } catch {}
        }
    } catch (Exception ex) { Console.WriteLine($"[DB] Rename outer warning: {ex.Message}"); }
}

// --- Auto-migration / EnsureCreated + recalc ResteBudget ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProjetDbContext>();
    try
    {
        if (sqlServerReachable)
        {
            try { db.Database.ExecuteSqlRaw("SELECT TOP 1 1 FROM [Capexes]"); }
            catch
            {
                Console.WriteLine("[DB] Tables manquantes sur SQL Server -> EnsureCreated...");
                db.Database.EnsureCreated();
                if (!db.Departements.Any()) { db.Departements.Add(new Departement { Nom = "Informatique" }); db.Departements.Add(new Departement { Nom = "Finance" }); db.SaveChanges(); }
                if (!db.Capexes.Any()) { db.Capexes.Add(new Capex { NomCapex = "CAPEX 2026 - IT", BudgetTotal = 100000, BudgetRestant = 100000 }); db.SaveChanges(); }
            }
        }
        else
        {
            db.Database.EnsureCreated();
            if (!db.Departements.Any())
            {
                db.Departements.AddRange(new Departement { Nom = "Informatique" }, new Departement { Nom = "Finance" }, new Departement { Nom = "RH" }, new Departement { Nom = "Production" });
                db.SaveChanges();
                var info = db.Departements.First(d => d.Nom == "Informatique");
                var fin = db.Departements.First(d => d.Nom == "Finance");
                db.Utilisateurs.AddRange(new Utilisateur { Nom = "Admin", DepartementId = info.Id }, new Utilisateur { Nom = "Finance User", DepartementId = fin.Id });
                db.Capexes.AddRange(new Capex { NomCapex = "CAPEX 2026 - IT", BudgetTotal = 100000, BudgetRestant = 100000 }, new Capex { NomCapex = "CAPEX 2026 - Production", BudgetTotal = 250000, BudgetRestant = 250000 });
                db.SaveChanges();
                Console.WriteLine("[DB] SQLite seed OK");
            }
        }
        // Recalcule BudgetRestant pour corriger les edits directs SSMS
        var capexes = db.Capexes.ToList();
        foreach (var c in capexes)
        {
            var consomme = db.DetailDemandes
                .Where(dd => dd.Demande.CapexId == c.CapexId && dd.Demande.Statut == backend.Models.StatutDemande.Acceptee)
                .Sum(dd => (decimal?)(dd.Quantite * dd.Prix)) ?? 0m;
            var resteCalcule = c.BudgetTotal - consomme;
            if (c.BudgetRestant != resteCalcule)
            {
                c.BudgetRestant = resteCalcule;
            }
        }
        db.SaveChanges();
        Console.WriteLine("[DB] BudgetRestant recalculé");
    }
    catch (Exception ex) { Console.WriteLine($"[DB] Init warning: {ex.Message}"); }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseCors("AllowReact");
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

var url = app.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5058";
Console.WriteLine($"[APP] Capex Manager pret sur {url}");
Console.WriteLine($"[APP] Swagger: {url}/swagger");

app.Run();
