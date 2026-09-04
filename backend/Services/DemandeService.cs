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
            .Include(d => d.Utilisateur)
            .Include(d => d.Capex)
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.IdDemande == id);

        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<Demande>> GetAllDemandesAsync()
    {
        var entities = await _context.Demandes
            .Include(d => d.Utilisateur)
            .Include(d => d.Capex)
            .AsNoTracking()
            .ToListAsync();

        return entities.Select(MapToModel).ToList();
    }

    public async Task<Demande> CreateDemandeAsync(CreateDemandeDto dto)
    {
        var utilisateur = await _context.Utilisateurs
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
            Rfx = dto.RFx,
            Statut = StatutDemande.EnAttente
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

        // EF insère Demande + tous les DetailDemande liés en une seule transaction implicite
        _context.Demandes.Add(entity);
        await _context.SaveChangesAsync();

        return new Demande
        {
            IdDemande = entity.IdDemande,
            UtilisateurId = entity.UtilisateurId,
            UtilisateurNom = utilisateur.Nom,
            Statut = entity.Statut,
            CapexId = entity.CapexId,
            CapexNom = capex.NomCapex,
            RFx = entity.Rfx,
            CreateAt = entity.CreateAt,
            DateValidation1 = entity.DateValidation1,
            DateValidation2 = entity.DateValidation2,
            DateValidateChef = entity.DateValidateChef,
            DateValidateFinance = entity.DateValidateFinance,
            DateValidateDirecteur = entity.DateValidateDirecteur
        };
    }

    private static Demande MapToModel(EfDemande entity) => new()
    {
        IdDemande = entity.IdDemande,
        UtilisateurId = entity.UtilisateurId,
        UtilisateurNom = entity.Utilisateur?.Nom ?? string.Empty,
        Statut = entity.Statut, 
        CapexId = entity.CapexId,
        CapexNom = entity.Capex?.NomCapex ?? string.Empty,
        RFx = entity.Rfx,
        CreateAt = entity.CreateAt,
        DateValidation1 = entity.DateValidation1,
        DateValidation2 = entity.DateValidation2,
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
        .FirstOrDefaultAsync(d => d.IdDemande == id);

    if (demande is null)
        throw new BusinessException($"La demande {id} n'existe pas.");

    if (demande.Statut != StatutDemande.EnAttente)
        throw new BusinessException("Cette demande a déjà été traitée.");

    var montant = demande.DetailDemandes.Sum(dd => dd.Quantite * dd.Prix);

    if (demande.Capex.ResteBudget < montant)
        throw new BusinessException("Budget restant insuffisant pour valider cette demande.");

    var maintenant = DateTime.UtcNow;
    demande.DateValidation1 ??= maintenant;
    demande.DateValidation2 ??= maintenant;
    demande.DateValidateChef ??= maintenant;
    demande.DateValidateFinance ??= maintenant;
    demande.DateValidateDirecteur ??= maintenant;

    if (!ToutesLesValidationsSontFaites(demande))
        throw new BusinessException("Toutes les validations doivent être faites avant de valider la demande.");

    demande.Capex.ResteBudget -= montant;   // <-- entité trackée, EF détecte le changement
    demande.Statut = StatutDemande.Acceptee;

    await _context.SaveChangesAsync();      // <-- persiste les DEUX modifications (Demande + Capex)

    return MapToModel(demande);
}

private static bool ToutesLesValidationsSontFaites(EfDemande demande) =>
    demande.DateValidation1.HasValue &&
    demande.DateValidation2.HasValue &&
    demande.DateValidateChef.HasValue &&
    demande.DateValidateFinance.HasValue &&
    demande.DateValidateDirecteur.HasValue;
}
