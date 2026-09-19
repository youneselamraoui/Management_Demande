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

        backend.Data.EfModels.Capex? capex = null;
        if (dto.CapexId != null)
        {
            capex = await _context.Capexes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == dto.CapexId);
            if (capex is null) throw new BusinessException($"Le Capex {dto.CapexId} n'existe pas.");
        }

        if (dto.Articles is null || dto.Articles.Count == 0)
            throw new BusinessException("Une demande doit contenir au moins un article.");

        foreach (var ligne in dto.Articles)
        {
            if (string.IsNullOrWhiteSpace(ligne.Article))
                throw new BusinessException("Le nom de l'article est obligatoire.");
            if (ligne.Quantite <= 0)
                throw new BusinessException($"Quantité invalide pour '{ligne.Article}'.");
            if (ligne.Prix != null && ligne.Prix < 0)
                throw new BusinessException($"Prix invalide pour '{ligne.Article}'.");
        }

        // Vérification budget : les demandes en attente engagent déjà le budget
        if (capex != null)
        {
            var montantNouveau = dto.Articles.Sum(a => a.Quantite * (a.Prix ?? 0));
            var statutsEngages = new[]
            {
                StatutDemande.BonDeCommande,
                StatutDemande.EnAttenteValidationAchat1,
                StatutDemande.EnAttenteValidationAchat2,
                StatutDemande.EnAttenteValidationChef,
                StatutDemande.EnAttenteValidationFinance,
                StatutDemande.EnAttenteConfirmationFinance,
                StatutDemande.EnAttenteValidationDirecteur
            };
            var engage = await _context.DetailDemandes
                .Where(dd => dd.Demande.CapexId == dto.CapexId && (
                    dd.Demande.Statut == StatutDemande.BonDeCommande ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat1 ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat2 ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationChef ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationFinance ||
                    dd.Demande.Statut == StatutDemande.EnAttenteConfirmationFinance ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationDirecteur))
                .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
            if (capex.BudgetTotal - engage < montantNouveau)
                throw new BusinessException($"Budget restant insuffisant pour ce Capex. Restant engagé: {capex.BudgetTotal - engage} $, demandé: {montantNouveau} $.");
        }

        var now = DateTime.UtcNow;
        var entity = new EfDemande
        {
            UtilisateurId = dto.UtilisateurId,
            CapexId = dto.CapexId,
            RFX = dto.RFX,
            Commentaire = dto.Commentaire,
            MontantReserve = dto.MontantReserve,
            CheminDevis = dto.CheminDevis,
            CheminSAP = dto.CheminSAP,
            CheminFinance = dto.CheminFinance,
            FichierPath = dto.FichierPath,
            Justification = dto.Justification,
            Sta1 = dto.Sta1,
            Sta2 = dto.Sta2,
            Stc = dto.Stc,
            Stf = dto.Stf,
            Std = dto.Std,
            Stu = dto.Stu,
            Stp = dto.Stp,
            Statut = StatutDemande.EnAttenteValidationAchat1,
            CreatedAt = now,
            UpdatedAt = now
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

        // Mettre à jour BudgetRestant stocké pour refléter l'engagement (en attente compte désormais)
        if (dto.CapexId != null)
        {
            var capexEnt = await _context.Capexes.FirstOrDefaultAsync(c => c.Id == dto.CapexId);
            if (capexEnt != null)
            {
                var statutsEngagesUpdate = new[]
                {
                    StatutDemande.BonDeCommande,
                    StatutDemande.EnAttenteValidationAchat1,
                    StatutDemande.EnAttenteValidationAchat2,
                    StatutDemande.EnAttenteValidationChef,
                    StatutDemande.EnAttenteValidationFinance,
                    StatutDemande.EnAttenteConfirmationFinance,
                    StatutDemande.EnAttenteValidationDirecteur
                };
                var engageUpdate = await _context.DetailDemandes
                    .Where(dd => dd.Demande.CapexId == dto.CapexId && (
                        dd.Demande.Statut == StatutDemande.BonDeCommande ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat1 ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat2 ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationChef ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationFinance ||
                        dd.Demande.Statut == StatutDemande.EnAttenteConfirmationFinance ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationDirecteur))
                    .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
                capexEnt.BudgetRestant = capexEnt.BudgetTotal - engageUpdate;
                await _context.SaveChangesAsync();
            }
        }

        var departementNom = utilisateur.Departement?.Nom ?? (await _context.Departements.AsNoTracking().Where(d => d.Id == utilisateur.DepartementId).Select(d => d.Nom).FirstOrDefaultAsync()) ?? string.Empty;
        return new Demande
        {
            Id = entity.Id,
            UtilisateurId = entity.UtilisateurId,
            UtilisateurNom = utilisateur.Nom,
            DepartementNom = departementNom,
            Statut = entity.Statut,
            CapexId = entity.CapexId,
            CapexNom = capex?.NomCapex ?? string.Empty,
            RFX = entity.RFX,
            Commentaire = entity.Commentaire,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            MontantReserve = entity.MontantReserve,
            CheminDevis = entity.CheminDevis,
            CheminSAP = entity.CheminSAP,
            CheminFinance = entity.CheminFinance,
            FichierPath = entity.FichierPath,
            Justification = entity.Justification,
            Sta1 = entity.Sta1,
            Sta2 = entity.Sta2,
            Stc = entity.Stc,
            Stf = entity.Stf,
            Std = entity.Std,
            Stu = entity.Stu,
            Stp = entity.Stp,
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
        Commentaire = entity.Commentaire,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt,
        MontantReserve = entity.MontantReserve,
        CheminDevis = entity.CheminDevis,
        CheminSAP = entity.CheminSAP,
        CheminFinance = entity.CheminFinance,
        FichierPath = entity.FichierPath,
        Justification = entity.Justification,
        Sta1 = entity.Sta1,
        Sta2 = entity.Sta2,
        Stc = entity.Stc,
        Stf = entity.Stf,
        Std = entity.Std,
        Stu = entity.Stu,
        Stp = entity.Stp,
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

    var montant = demande.DetailDemandes.Sum(dd => dd.Quantite * (dd.Prix ?? 0));
    var maintenant = DateTime.UtcNow;
    demande.UpdatedAt = maintenant;

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
        case StatutDemande.EnAttenteConfirmationFinance:
            demande.DateValidateFinance = maintenant;
            demande.Statut = StatutDemande.EnAttenteValidationDirecteur;
            break;
        case StatutDemande.EnAttenteValidationDirecteur:
            demande.DateValidateDirecteur = maintenant;
            if (demande.CapexId != null && demande.Capex != null)
            {
                // Le budget est déjà engagé par les demandes en attente (incluant cette demande)
                // donc la validation finale ne change pas le total engagé : on vérifie seulement que l'engagé total reste <= BudgetTotal
                var statutsEngages = new[]
                {
                    StatutDemande.BonDeCommande,
                    StatutDemande.EnAttenteValidationAchat1,
                    StatutDemande.EnAttenteValidationAchat2,
                    StatutDemande.EnAttenteValidationChef,
                    StatutDemande.EnAttenteValidationFinance,
                    StatutDemande.EnAttenteConfirmationFinance,
                    StatutDemande.EnAttenteValidationDirecteur
                };
                var engage = await _context.DetailDemandes
                    .Where(dd => dd.Demande.CapexId == demande.CapexId && (
                        dd.Demande.Statut == StatutDemande.BonDeCommande ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat1 ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat2 ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationChef ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationFinance ||
                        dd.Demande.Statut == StatutDemande.EnAttenteConfirmationFinance ||
                        dd.Demande.Statut == StatutDemande.EnAttenteValidationDirecteur))
                    .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
                // engage inclut déjà cette demande (en attente), donc reste = BudgetTotal - engage
                var reste = demande.Capex.BudgetTotal - engage;
                if (reste < 0)
                    throw new BusinessException("Budget restant insuffisant pour valider cette demande (budget déjà engagé par les demandes en attente).");
                if (!ToutesLesValidationsSontFaites(demande))
                    throw new BusinessException("Toutes les validations doivent être faites avant Bon de commande.");
                // Le passage EnAttente -> BonDeCommande ne change pas le total engagé, donc BudgetRestant reste identique (= reste)
                demande.Capex.BudgetRestant = reste;
            }
            demande.Statut = StatutDemande.BonDeCommande;
            // Auto-création BonCommande si inexistant
            var fournisseur = await _context.Fournisseurs.FirstOrDefaultAsync();
            if (fournisseur == null)
            {
                fournisseur = new backend.Data.EfModels.Fournisseur { Nom = "Fournisseur par défaut" };
                _context.Fournisseurs.Add(fournisseur);
                await _context.SaveChangesAsync();
            }
            var existsBc = await _context.BonCommandes.AnyAsync(b => b.DemandeId == demande.Id);
            if (!existsBc)
            {
                _context.BonCommandes.Add(new backend.Data.EfModels.BonCommande
                {
                    DemandeId = demande.Id,
                    Po = $"PO-{demande.Id:00000}",
                    FournisseurId = fournisseur.Id,
                    DateCreation = maintenant
                });
            }
            break;
        default:
            throw new BusinessException($"Statut {demande.Statut} non géré pour validation.");
    }

    await _context.SaveChangesAsync();
    return MapToModel(demande);
}

public async Task<Demande> RefuserDemandeAsync(int id)
{
    var demande = await _context.Demandes.Include(d => d.Capex).Include(d => d.DetailDemandes).FirstOrDefaultAsync(d => d.Id == id);

    if (demande is null)
        throw new BusinessException($"La demande {id} n'existe pas.");
    if (!demande.Statut.EstEnAttenteDeValidation())
        throw new BusinessException("Cette demande ne peut plus être refusée.");

    var maintenant = DateTime.UtcNow;
    demande.UpdatedAt = maintenant;
    // Libération du budget engagé si la demande avait un Capex : après refus, le montant n'est plus compté
    var wasEngaged = demande.CapexId != null && demande.Capex != null;
    var montantRefuse = wasEngaged ? demande.DetailDemandes.Sum(dd => dd.Quantite * (dd.Prix ?? 0)) : 0;
    demande.Statut = demande.Statut switch
    {
        StatutDemande.EnAttenteValidationAchat1 => RefuserAchat1(demande, maintenant),
        StatutDemande.EnAttenteValidationAchat2 => RefuserAchat2(demande, maintenant),
        StatutDemande.EnAttenteValidationChef => RefuserChef(demande, maintenant),
        StatutDemande.EnAttenteValidationFinance => RefuserFinance(demande, maintenant),
        StatutDemande.EnAttenteConfirmationFinance => RefuserFinance(demande, maintenant),
        StatutDemande.EnAttenteValidationDirecteur => RefuserDirecteur(demande, maintenant),
        _ => throw new BusinessException("Statut non géré pour le refus.")
    };

    await _context.SaveChangesAsync();
    if (wasEngaged)
    {
        // Recalculer le BudgetRestant après libération (Bon+EnAttente)
        var statutsEngages = new[]
        {
            StatutDemande.BonDeCommande,
            StatutDemande.EnAttenteValidationAchat1,
            StatutDemande.EnAttenteValidationAchat2,
            StatutDemande.EnAttenteValidationChef,
            StatutDemande.EnAttenteValidationFinance,
            StatutDemande.EnAttenteConfirmationFinance,
            StatutDemande.EnAttenteValidationDirecteur
        };
        var engage = await _context.DetailDemandes
            .Where(dd => dd.Demande.CapexId == demande.CapexId && (
                dd.Demande.Statut == StatutDemande.BonDeCommande ||
                dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat1 ||
                dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat2 ||
                dd.Demande.Statut == StatutDemande.EnAttenteValidationChef ||
                dd.Demande.Statut == StatutDemande.EnAttenteValidationFinance ||
                dd.Demande.Statut == StatutDemande.EnAttenteConfirmationFinance ||
                dd.Demande.Statut == StatutDemande.EnAttenteValidationDirecteur))
            .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
        demande.Capex!.BudgetRestant = demande.Capex.BudgetTotal - engage;
        await _context.SaveChangesAsync();
    }
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
        var statutsEngages = new[]
        {
            StatutDemande.BonDeCommande,
            StatutDemande.EnAttenteValidationAchat1,
            StatutDemande.EnAttenteValidationAchat2,
            StatutDemande.EnAttenteValidationChef,
            StatutDemande.EnAttenteValidationFinance,
            StatutDemande.EnAttenteConfirmationFinance,
            StatutDemande.EnAttenteValidationDirecteur
        };
        var capexes = await _context.Capexes.ToListAsync();
        foreach (var c in capexes)
        {
            var consomme = await _context.DetailDemandes
                .Where(dd => dd.Demande.CapexId == c.Id && (
                    dd.Demande.Statut == StatutDemande.BonDeCommande ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat1 ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationAchat2 ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationChef ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationFinance ||
                    dd.Demande.Statut == StatutDemande.EnAttenteConfirmationFinance ||
                    dd.Demande.Statut == StatutDemande.EnAttenteValidationDirecteur))
                .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
            c.BudgetRestant = c.BudgetTotal - consomme;
        }
        await _context.SaveChangesAsync();
    }
}
