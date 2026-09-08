using backend.Services;
using backend.Services.Interfaces;
using backend.Data.EfModels;
using Microsoft.EntityFrameworkCore;

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

// --- EF Core : SQL Server uniquement ---
var cs = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddDbContext<ProjetDbContext>(options => options.UseSqlServer(cs));
Console.WriteLine($"[DB] SQL Server : {cs}");

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
        var renameSql = @"
IF OBJECT_ID('Capex') IS NOT NULL AND OBJECT_ID('Capexes') IS NULL EXEC sp_rename 'Capex', 'Capexes';
IF OBJECT_ID('Demande') IS NOT NULL AND OBJECT_ID('Demandes') IS NULL EXEC sp_rename 'Demande', 'Demandes';
IF OBJECT_ID('DetailDemande') IS NOT NULL AND OBJECT_ID('DetailsDemandes') IS NULL EXEC sp_rename 'DetailDemande', 'DetailsDemandes';
IF OBJECT_ID('Departement') IS NOT NULL AND OBJECT_ID('Departements') IS NULL EXEC sp_rename 'Departement', 'Departements';
IF OBJECT_ID('Utilisateur') IS NOT NULL AND OBJECT_ID('Utilisateurs') IS NULL EXEC sp_rename 'Utilisateur', 'Utilisateurs';
IF COL_LENGTH('Demandes','idDemande') IS NOT NULL AND COL_LENGTH('Demandes','Id') IS NULL EXEC sp_rename 'Demandes.idDemande', 'Id', 'COLUMN';
IF COL_LENGTH('Demandes','RFx') IS NOT NULL AND COL_LENGTH('Demandes','RFX') IS NULL EXEC sp_rename 'Demandes.RFx', 'RFX', 'COLUMN';
IF COL_LENGTH('Demandes','CreateAt') IS NOT NULL AND COL_LENGTH('Demandes','CreatedAt') IS NULL EXEC sp_rename 'Demandes.CreateAt', 'CreatedAt', 'COLUMN';
IF COL_LENGTH('Demandes','DateValidation1') IS NOT NULL AND COL_LENGTH('Demandes','DateValidationAchat1') IS NULL EXEC sp_rename 'Demandes.DateValidation1', 'DateValidationAchat1', 'COLUMN';
IF COL_LENGTH('Demandes','DateValidation2') IS NOT NULL AND COL_LENGTH('Demandes','DateValidationAchat2') IS NULL EXEC sp_rename 'Demandes.DateValidation2', 'DateValidationAchat2', 'COLUMN';
IF COL_LENGTH('Capexes','ResteBudget') IS NOT NULL AND COL_LENGTH('Capexes','BudgetRestant') IS NULL EXEC sp_rename 'Capexes.ResteBudget', 'BudgetRestant', 'COLUMN';
-- Migration anciens statuts vers nouveaux (EnAttente/Acceptee/Rejetee/ValidationAchat* -> EnAttenteValidation* / BonDeCommande / Refusee*)
UPDATE Demandes SET Statut='EnAttenteValidationAchat1' WHERE Statut IN ('EnAttente','ValidationAchat1');
UPDATE Demandes SET Statut='EnAttenteValidationAchat2' WHERE Statut='ValidationAchat2';
UPDATE Demandes SET Statut='EnAttenteValidationChef' WHERE Statut='ValidationChef';
UPDATE Demandes SET Statut='EnAttenteValidationFinance' WHERE Statut='ValidationFinance';
UPDATE Demandes SET Statut='EnAttenteValidationDirecteur' WHERE Statut='ValidationDirecteur';
UPDATE Demandes SET Statut='BonDeCommande' WHERE Statut='Acceptee';
UPDATE Demandes SET Statut='RefuseeAchat1' WHERE Statut='Rejetee' AND DateValidationAchat1 IS NULL;
UPDATE Demandes SET Statut='RefuseeAchat2' WHERE Statut='Rejetee' AND DateValidationAchat1 IS NOT NULL AND DateValidationAchat2 IS NULL;
";
        try { db.Database.ExecuteSqlRaw(renameSql); Console.WriteLine("[DB] Renommage verifie"); } catch (Exception ex) { Console.WriteLine($"[DB] Rename warning: {ex.Message}"); }
    } catch (Exception ex) { Console.WriteLine($"[DB] Rename outer: {ex.Message}"); }
}

// --- Auto-migration / EnsureCreated + recalc BudgetRestant ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ProjetDbContext>();
    try
    {
        try { db.Database.ExecuteSqlRaw("SELECT TOP 1 1 FROM [Capexes]"); }
        catch
        {
            Console.WriteLine("[DB] Tables manquantes -> EnsureCreated...");
            db.Database.EnsureCreated();
            if (!db.Departements.Any()) { db.Departements.Add(new Departement { Nom = "Informatique" }); db.Departements.Add(new Departement { Nom = "Finance" }); db.SaveChanges(); }
            if (!db.Capexes.Any()) { db.Capexes.Add(new Capex { NomCapex = "CAPEX 2026 - IT", BudgetTotal = 100000, BudgetRestant = 100000 }); db.SaveChanges(); }
        }
        var capexes = db.Capexes.ToList();
        foreach (var c in capexes)
        {
            var consomme = db.DetailDemandes
                .Where(dd => dd.Demande.CapexId == c.CapexId && dd.Demande.Statut == backend.Models.StatutDemande.BonDeCommande)
                .Sum(dd => (decimal?)(dd.Quantite * dd.Prix)) ?? 0m;
            var reste = c.BudgetTotal - consomme;
            if (c.BudgetRestant != reste) c.BudgetRestant = reste;
        }
        db.SaveChanges();
        Console.WriteLine("[DB] BudgetRestant recalcule");
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
