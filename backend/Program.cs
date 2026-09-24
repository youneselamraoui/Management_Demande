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
        policy.WithOrigins("http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- EF Core : SQL Server uniquement ---
var cs = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddDbContext<ProjetDbContext>(options => options.UseSqlServer(cs).LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information));
Console.WriteLine($"[DB] SQL Server : {cs}");

builder.Services.AddScoped<IDepartementService, DepartementService>();
builder.Services.AddScoped<IUtilisateurService, UtilisateurService>();
builder.Services.AddScoped<ICapexService, CapexService>();
builder.Services.AddScoped<IDemandeService, DemandeService>();
builder.Services.AddScoped<IDetailDemandeService, DetailDemandeService>();
builder.Services.AddScoped<IBonCommandeService, BonCommandeService>();
builder.Services.AddScoped<IFournisseurService, FournisseurService>();

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
IF COL_LENGTH('Capexes','CapexId') IS NOT NULL AND COL_LENGTH('Capexes','Id') IS NULL EXEC sp_rename 'Capexes.CapexId', 'Id', 'COLUMN';
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
-- Normalisation vers affichage avec accents (référentiel 16 valeurs avec SAP/EMEA/Info)
UPDATE Demandes SET Statut='En attente validation achat1' WHERE Statut='EnAttenteValidationAchat1';
UPDATE Demandes SET Statut='En attente validation achat2' WHERE Statut='EnAttenteValidationAchat2';
UPDATE Demandes SET Statut='En attente validation chef' WHERE Statut='EnAttenteValidationChef';
UPDATE Demandes SET Statut='En attente confirmation finance' WHERE Statut IN ('EnAttenteValidationFinance','En attente validation finance','EnAttenteConfirmationFinance');
UPDATE Demandes SET Statut='En attente validation directeur' WHERE Statut='EnAttenteValidationDirecteur';
UPDATE Demandes SET Statut='En attente insertion SAP' WHERE Statut='EnAttenteInsertionSAP';
UPDATE Demandes SET Statut='En attente validation EMEA' WHERE Statut='EnAttenteValidationEMEA';
UPDATE Demandes SET Statut='En attente informations complémentaires' WHERE Statut='EnAttenteInformationsComplementaires';
UPDATE Demandes SET Statut='Bon de commande' WHERE Statut IN ('BonDeCommande','Bon commande');
UPDATE Demandes SET Statut='Refusé achat2' WHERE Statut IN ('RefuseeAchat2','Refusée achat2');
UPDATE Demandes SET Statut='Refusé finance' WHERE Statut IN ('RefuseeFinance','Refusée finance');
UPDATE Demandes SET Statut='Refusé directeur' WHERE Statut IN ('RefuseeDirecteur','Refusée directeur');
UPDATE Demandes SET Statut='Refusé EMEA' WHERE Statut IN ('RefuseeEMEA','Refusée EMEA');
-- Garder Refusé achat1 / Refusé chef pour compat mais non proposés en filtre
UPDATE Demandes SET Statut='Refusé achat1' WHERE Statut='RefuseeAchat1';
UPDATE Demandes SET Statut='Refusé chef' WHERE Statut='RefuseeChef';
";
        try { db.Database.ExecuteSqlRaw(renameSql); Console.WriteLine("[DB] Renommage verifie"); } catch (Exception ex) { Console.WriteLine($"[DB] Rename warning: {ex.Message}"); }

        // NOTE : ADD puis UPDATE séparés (SQL Server parse tout le batch avant exécution,
        var alignAddSql = @"
IF COL_LENGTH('Utilisateurs','Email') IS NULL ALTER TABLE [Utilisateurs] ADD [Email] nvarchar(max) NOT NULL DEFAULT '';
IF COL_LENGTH('Utilisateurs','MotDePasse') IS NULL ALTER TABLE [Utilisateurs] ADD [MotDePasse] nvarchar(max) NOT NULL DEFAULT '';
IF COL_LENGTH('Utilisateurs','Role') IS NULL ALTER TABLE [Utilisateurs] ADD [Role] nvarchar(max) NOT NULL DEFAULT 'User';
IF COL_LENGTH('Utilisateurs','ChefId') IS NULL ALTER TABLE [Utilisateurs] ADD [ChefId] int NULL;
IF COL_LENGTH('Utilisateurs','Active') IS NULL ALTER TABLE [Utilisateurs] ADD [Active] bit NOT NULL DEFAULT 1;
IF COL_LENGTH('Utilisateurs','DoitChangerMotDePasse') IS NULL ALTER TABLE [Utilisateurs] ADD [DoitChangerMotDePasse] bit NULL;
IF COL_LENGTH('Utilisateurs','EmailChef') IS NULL ALTER TABLE [Utilisateurs] ADD [EmailChef] nvarchar(max) NULL;
IF COL_LENGTH('Utilisateurs','NomChef') IS NULL ALTER TABLE [Utilisateurs] ADD [NomChef] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','Commentaire') IS NULL ALTER TABLE [Demandes] ADD [Commentaire] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','UpdatedAt') IS NULL ALTER TABLE [Demandes] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE();
IF COL_LENGTH('Demandes','MontantReserve') IS NULL ALTER TABLE [Demandes] ADD [MontantReserve] float NULL;
IF COL_LENGTH('Demandes','CheminDevis') IS NULL ALTER TABLE [Demandes] ADD [CheminDevis] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','CheminSAP') IS NULL ALTER TABLE [Demandes] ADD [CheminSAP] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','CheminFinance') IS NULL ALTER TABLE [Demandes] ADD [CheminFinance] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','FichierPath') IS NULL ALTER TABLE [Demandes] ADD [FichierPath] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','Justification') IS NULL ALTER TABLE [Demandes] ADD [Justification] nvarchar(max) NULL;
IF COL_LENGTH('Demandes','sta1') IS NULL ALTER TABLE [Demandes] ADD [sta1] int NULL;
IF COL_LENGTH('Demandes','sta2') IS NULL ALTER TABLE [Demandes] ADD [sta2] int NULL;
IF COL_LENGTH('Demandes','stc') IS NULL ALTER TABLE [Demandes] ADD [stc] int NULL;
IF COL_LENGTH('Demandes','stf') IS NULL ALTER TABLE [Demandes] ADD [stf] int NULL;
IF COL_LENGTH('Demandes','std') IS NULL ALTER TABLE [Demandes] ADD [std] int NULL;
IF COL_LENGTH('Demandes','stu') IS NULL ALTER TABLE [Demandes] ADD [stu] int NULL;
IF COL_LENGTH('Demandes','stp') IS NULL ALTER TABLE [Demandes] ADD [stp] int NULL;
";
        try { db.Database.ExecuteSqlRaw(alignAddSql); Console.WriteLine("[DB] Alignement ADD verifie (photo SSMS)"); } catch (Exception ex) { Console.WriteLine($"[DB] Align ADD warning: {ex.Message}"); }
        try { db.Database.ExecuteSqlRaw("UPDATE [Demandes] SET [UpdatedAt] = [CreatedAt] WHERE [UpdatedAt] IS NULL;"); Console.WriteLine("[DB] Alignement backfill UpdatedAt OK"); } catch (Exception ex) { Console.WriteLine($"[DB] Align backfill warning: {ex.Message}"); }
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
            var statutsEngages = new[]
            {
                backend.Models.StatutDemande.BonDeCommande,
                backend.Models.StatutDemande.EnAttenteValidationAchat1,
                backend.Models.StatutDemande.EnAttenteValidationAchat2,
                backend.Models.StatutDemande.EnAttenteValidationChef,
                backend.Models.StatutDemande.EnAttenteValidationFinance,
                backend.Models.StatutDemande.EnAttenteConfirmationFinance,
                backend.Models.StatutDemande.EnAttenteValidationDirecteur,
                backend.Models.StatutDemande.EnAttenteInsertionSAP,
                backend.Models.StatutDemande.EnAttenteValidationEMEA,
                backend.Models.StatutDemande.EnAttenteInformationsComplementaires
            };
            var consomme = db.DetailDemandes
                .Where(dd => dd.Demande.CapexId == c.Id && (
                    dd.Demande.Statut == backend.Models.StatutDemande.BonDeCommande ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteValidationAchat1 ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteValidationAchat2 ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteValidationChef ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteValidationFinance ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteConfirmationFinance ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteValidationDirecteur ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteInsertionSAP ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteValidationEMEA ||
                    dd.Demande.Statut == backend.Models.StatutDemande.EnAttenteInformationsComplementaires))
                .Sum(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
            var reste = c.BudgetTotal - consomme;
            if (c.BudgetRestant != reste) c.BudgetRestant = reste;
        }
        db.SaveChanges();
        Console.WriteLine("[DB] BudgetRestant recalcule (incluant en attente)");
        // Assurer un fournisseur par défaut et backfill BonCommandes pour les demandes déjà en BonDeCommande
        try
        {
            if (!db.Fournisseurs.Any())
            {
                db.Fournisseurs.Add(new Fournisseur { Nom = "Fournisseur par défaut" });
                db.SaveChanges();
            }
            var fourDef = db.Fournisseurs.First();
            var existingBcIds = db.BonCommandes.Select(b => b.DemandeId).ToHashSet();
            var demandesBc = db.Demandes.Where(d => d.Statut == backend.Models.StatutDemande.BonDeCommande).ToList();
            var toAdd = demandesBc.Where(d => !existingBcIds.Contains(d.Id)).Select(d => new BonCommande
            {
                DemandeId = d.Id,
                Po = $"PO-{d.Id:00000}",
                FournisseurId = fourDef.Id,
                DateCreation = d.DateValidateDirecteur ?? d.CreatedAt
            }).ToList();
            if (toAdd.Any())
            {
                db.BonCommandes.AddRange(toAdd);
                db.SaveChanges();
                Console.WriteLine($"[DB] Backfill BonCommandes: {toAdd.Count} créés");
            }
        }
        catch (Exception ex) { Console.WriteLine($"[DB] BonCommande backfill warning: {ex.Message}"); }
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
