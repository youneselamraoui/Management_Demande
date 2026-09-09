using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfDemande = backend.Data.EfModels.Demande;
using EfDetailDemande = backend.Data.EfModels.DetailDemande;

namespace backend.Services;

public class DemandeService : IDemandeService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public DemandeService(backend.Data.EfModels.ProjetDbContext context) => _context = context;

    public async Task<Demande?> GetDemandeAsync(int id)
    {
        var entity = await _context.Demandes
            .Include(d => d.Utilisateur).ThenInclude(u => u.Departement)
            .Include(d => d.Capex)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<Demande>> GetAllDemandesAsync()
    {
        var entities = await _context.Demandes
            .Include(d => d.Utilisateur).ThenInclude(u => u.Departement)
            .Include(d => d.Capex)
            .AsNoTracking()
            .ToListAsync();

        return entities.Select(MapToModel).ToList();
    }

    public async Task<Demande> CreateDemandeAsync(CreateDemandeDto dto)
    {
        var utilisateur = await _context.Utilisateurs
            .Include(u => u.Departement)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == dto.UtilisateurId);
        if (utilisateur is null)
            throw new BusinessException($"L'utilisateur {dto.UtilisateurId} n'existe pas.");

        var capex = await _context.Capexes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CapexId == dto.CapexId);
        if (capex is null)
            throw new BusinessException($"Le Capex {dto.CapexId} n'existe pas.");

        if (dto.Articles is null || dto.Articles.Count == 0)
            throw new BusinessException("Une demande doit contenir au moins un article.");

        foreach (var ligne in dto.Articles)
        {
            if (string.IsNullOrWhiteSpace(ligne.Article))
                throw new BusinessException("Le nom de l'article est obligatoire.");
            if (ligne.Quantite <= 0)
                throw new BusinessException($"Quantité invalide pour '{ligne.Article}'.");
            if (ligne.Prix < 0)
                throw new BusinessException($"Prix invalide pour '{ligne.Article}'.");
        }

        var entity = new EfDemande
        {
            UtilisateurId = dto.UtilisateurId,
            CapexId = dto.CapexId,
            RFX = dto.RFX,
            Statut = StatutDemande.EnAttenteValidationAchat1,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var a in dto.Articles)
        {
            entity.DetailDemandes.Add(new EfDetailDemande
            {
                Article = a.Article,
                Quantite = a.Quantite,
                Prix = a.Prix,
                Devis = a.Devis
            });
        }

        _context.Demandes.Add(entity);
        await _context.SaveChangesAsync();

        var departementNom = utilisateur.Departement?.Nom ?? (await _context.Departements.AsNoTracking().Where(d => d.Id == utilisateur.DepartementId).Select(d => d.Nom).FirstOrDefaultAsync()) ?? string.Empty;
        return new Demande
        {
            Id = entity.Id,
            UtilisateurId = entity.UtilisateurId,
            UtilisateurNom = utilisateur.Nom,
            DepartementNom = departementNom,
            Statut = entity.Statut,
            CapexId = entity.CapexId,
            CapexNom = capex.NomCapex,
            RFX = entity.RFX,
            CreatedAt = entity.CreatedAt,
            DateValidationAchat1 = entity.DateValidationAchat1,
            DateValidationAchat2 = entity.DateValidationAchat2,
            DateValidateChef = entity.DateValidateChef,
            DateValidateFinance = entity.DateValidateFinance,
            DateValidateDirecteur = entity.DateValidateDirecteur
        };
    }

    private static Demande MapToModel(EfDemande entity) => new()
    {
        Id = entity.Id,
        UtilisateurId = entity.UtilisateurId,
        UtilisateurNom = entity.Utilisateur?.Nom ?? string.Empty,
        DepartementNom = entity.Utilisateur?.Departement?.Nom ?? string.Empty,
        Statut = entity.Statut,
        CapexId = entity.CapexId,
        CapexNom = entity.Capex?.NomCapex ?? string.Empty,
        RFX = entity.RFX,
        CreatedAt = entity.CreatedAt,
        DateValidationAchat1 = entity.DateValidationAchat1,
        DateValidationAchat2 = entity.DateValidationAchat2,
        DateValidateChef = entity.DateValidateChef,
        DateValidateFinance = entity.DateValidateFinance,
        DateValidateDirecteur = entity.DateValidateDirecteur
    };
    public async Task<Demande> ValiderDemandeAsync(int id)
{
    var demande = await _context.Demandes
        .Include(d => d.DetailDemandes)
        .Include(d => d.Capex)
        .Include(d => d.Utilisateur)
        .FirstOrDefaultAsync(d => d.Id == id);

    if (demande is null)
        throw new BusinessException($"La demande {id} n'existe pas.");

    if (!demande.Statut.EstEnAttenteDeValidation())
        throw new BusinessException("Cette demande a déjà été traitée.");

    var montant = demande.DetailDemandes.Sum(dd => dd.Quantite * dd.Prix);
    var maintenant = DateTime.UtcNow;

    // Chaque validation renseigne sa date puis fait avancer la demande vers l'étape suivante.
    switch (demande.Statut)
    {
        case StatutDemande.EnAttenteValidationAchat1:
            demande.DateValidationAchat1 = maintenant;
            demande.Statut = StatutDemande.EnAttenteValidationAchat2;
            break;
        case StatutDemande.EnAttenteValidationAchat2:
            demande.DateValidationAchat2 = maintenant;
            demande.Statut = StatutDemande.EnAttenteValidationChef;
            break;
        case StatutDemande.EnAttenteValidationChef:
            demande.DateValidateChef = maintenant;
            demande.Statut = StatutDemande.EnAttenteValidationFinance;
            break;
        case StatutDemande.EnAttenteValidationFinance:
            demande.DateValidateFinance = maintenant;
            demande.Statut = StatutDemande.EnAttenteValidationDirecteur;
            break;
        case StatutDemande.EnAttenteValidationDirecteur:
            demande.DateValidateDirecteur = maintenant;
            var consommeActuel = await _context.DetailDemandes
                .Where(dd => dd.Demande.CapexId == demande.CapexId && dd.Demande.Statut == StatutDemande.BonDeCommande)
                .SumAsync(dd => (decimal?)(dd.Quantite * dd.Prix)) ?? 0m;
            var resteCalcule = demande.Capex.BudgetTotal - consommeActuel;
            if (resteCalcule < montant)
                throw new BusinessException("Budget restant insuffisant pour valider cette demande.");
            if (!ToutesLesValidationsSontFaites(demande))
                throw new BusinessException("Toutes les validations doivent être faites avant Bon de commande.");
            demande.Capex.BudgetRestant = resteCalcule - montant;
            demande.Statut = StatutDemande.BonDeCommande;
            break;
        default:
            throw new BusinessException($"Statut {demande.Statut} non géré pour validation.");
    }

    await _context.SaveChangesAsync();
    return MapToModel(demande);
}

public async Task<Demande> RefuserDemandeAsync(int id)
{
    var demande = await _context.Demandes.FirstOrDefaultAsync(d => d.Id == id);

    if (demande is null)
        throw new BusinessException($"La demande {id} n'existe pas.");
    if (!demande.Statut.EstEnAttenteDeValidation())
        throw new BusinessException("Cette demande ne peut plus être refusée.");

    var maintenant = DateTime.UtcNow;
    demande.Statut = demande.Statut switch
    {
        StatutDemande.EnAttenteValidationAchat1 => RefuserAchat1(demande, maintenant),
        StatutDemande.EnAttenteValidationAchat2 => RefuserAchat2(demande, maintenant),
        StatutDemande.EnAttenteValidationChef => RefuserChef(demande, maintenant),
        StatutDemande.EnAttenteValidationFinance => RefuserFinance(demande, maintenant),
        StatutDemande.EnAttenteValidationDirecteur => RefuserDirecteur(demande, maintenant),
        _ => throw new BusinessException("Statut non géré pour le refus.")
    };

    await _context.SaveChangesAsync();
    return MapToModel(demande);
}

private static StatutDemande RefuserAchat1(EfDemande demande, DateTime date)
{
    demande.DateValidationAchat1 = date;
    return StatutDemande.RefuseeAchat1;
}

private static StatutDemande RefuserAchat2(EfDemande demande, DateTime date)
{
    demande.DateValidationAchat2 = date;
    return StatutDemande.RefuseeAchat2;
}

private static StatutDemande RefuserChef(EfDemande demande, DateTime date)
{
    demande.DateValidateChef = date;
    return StatutDemande.RefuseeChef;
}

private static StatutDemande RefuserFinance(EfDemande demande, DateTime date)
{
    demande.DateValidateFinance = date;
    return StatutDemande.RefuseeFinance;
}

private static StatutDemande RefuserDirecteur(EfDemande demande, DateTime date)
{
    demande.DateValidateDirecteur = date;
    return StatutDemande.RefuseeDirecteur;
}

private static bool ToutesLesValidationsSontFaites(EfDemande demande) =>
    demande.DateValidationAchat1.HasValue &&
    demande.DateValidationAchat2.HasValue &&
    demande.DateValidateChef.HasValue &&
    demande.DateValidateFinance.HasValue &&
    demande.DateValidateDirecteur.HasValue;

    public async Task RecalculerResteBudgetAsync()
    {
        var capexes = await _context.Capexes.ToListAsync();
        foreach (var c in capexes)
        {
            var consomme = await _context.DetailDemandes
                .Where(dd => dd.Demande.CapexId == c.CapexId && dd.Demande.Statut == StatutDemande.BonDeCommande)
                .SumAsync(dd => (decimal?)(dd.Quantite * dd.Prix)) ?? 0m;
            c.BudgetRestant = c.BudgetTotal - consomme;
        }
        await _context.SaveChangesAsync();
    }
}
