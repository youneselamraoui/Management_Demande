using backend.DTOs;
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
// Si SQL Server joignable -> SqlServer, sinon -> SQLite (capex.db) pour app portable sans install
var csSqlServer = builder.Configuration.GetConnectionString("DefaultConnection")!;
var csSqlite = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=capex.db";
var useFallback = builder.Configuration.GetValue<bool>("UseSqliteFallback", true);

bool sqlServerReachable = false;
if (!useFallback)
{
    sqlServerReachable = true; // force SqlServer
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

// --- Services (tous sur EF Core) ---
builder.Services.AddScoped<IDepartementService, DepartementService>();
builder.Services.AddScoped<IUtilisateurService, UtilisateurService>();
builder.Services.AddScoped<ICapexService, CapexService>();
builder.Services.AddScoped<IDemandeService, DemandeService>();
builder.Services.AddScoped<IDetailDemandeService, DetailDemandeService>();

var app = builder.Build();

// --- Auto-migration / EnsureCreated pour mode portable ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProjetDbContext>();
    try
    {
        if (sqlServerReachable)
        {
            // SQL Server : teste si tables existent, sinon applique EnsureCreated
            try { db.Database.ExecuteSqlRaw("SELECT TOP 1 1 FROM [Capex]"); }
            catch
            {
                Console.WriteLine("[DB] Tables manquantes sur SQL Server -> EnsureCreated...");
                db.Database.EnsureCreated();
                // seed minimal si vide
                if (!db.Departements.Any()) { db.Departements.Add(new Departement { Nom = "Informatique" }); db.Departements.Add(new Departement { Nom = "Finance" }); db.SaveChanges(); }
                if (!db.Capexes.Any()) { db.Capexes.Add(new Capex { NomCapex = "CAPEX 2026 - IT", BudgetTotal = 100000, ResteBudget = 100000 }); db.SaveChanges(); }
            }
        }
        else
        {
            // SQLite : EnsureCreated (cree tout le schema)
            db.Database.EnsureCreated();
            if (!db.Departements.Any())
            {
                db.Departements.AddRange(new Departement { Nom = "Informatique" }, new Departement { Nom = "Finance" }, new Departement { Nom = "RH" }, new Departement { Nom = "Production" });
                db.SaveChanges();
                var info = db.Departements.First(d => d.Nom == "Informatique");
                var fin = db.Departements.First(d => d.Nom == "Finance");
                db.Utilisateurs.AddRange(new Utilisateur { Nom = "Admin", DepartementId = info.Id }, new Utilisateur { Nom = "Finance User", DepartementId = fin.Id });
                db.Capexes.AddRange(new Capex { NomCapex = "CAPEX 2026 - IT", BudgetTotal = 100000, ResteBudget = 100000 }, new Capex { NomCapex = "CAPEX 2026 - Production", BudgetTotal = 250000, ResteBudget = 250000 });
                db.SaveChanges();
                Console.WriteLine("[DB] SQLite seed OK");
            }
        }
    }
    catch (Exception ex) { Console.WriteLine($"[DB] Init warning: {ex.Message}"); }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- Frontend embarque : sert le build Vite depuis wwwroot ---
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseCors("AllowReact");
app.UseAuthorization();

app.MapControllers();
// SPA fallback : toute route non-API renvoie index.html (pour react-router)
app.MapFallbackToFile("index.html");

var url = app.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5058";
Console.WriteLine($"[APP] Capex Manager pret sur {url} (et https://localhost:7169 si configure)");
Console.WriteLine($"[APP] Swagger: {url}/swagger");

app.Run();