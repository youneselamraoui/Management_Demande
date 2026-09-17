using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfCapex = backend.Data.EfModels.Capex;

namespace backend.Services;

public class CapexService : ICapexService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public CapexService(backend.Data.EfModels.ProjetDbContext context) => _context = context;

    public async Task<Capex?> GetCapexAsync(int id)
    {
        var entity = await _context.Capexes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return null;
        var reste = await CalculateResteBudgetAsync(id, entity.BudgetTotal);
        return MapToModel(entity, reste);
    }

    public async Task<List<Capex>> GetAllCapexAsync()
    {
        var entities = await _context.Capexes.AsNoTracking().ToListAsync();
        var result = new List<Capex>();
        foreach (var e in entities)
        {
            var reste = await CalculateResteBudgetAsync(e.Id, e.BudgetTotal);
            result.Add(MapToModel(e, reste));
        }
        return result;
    }

    // Statuts qui engagent le budget : Bon de commande + toutes les demandes en attente (réservation)
    private static readonly StatutDemande[] StatutsEngages = new[]
    {
        StatutDemande.BonDeCommande,
        StatutDemande.EnAttenteValidationAchat1,
        StatutDemande.EnAttenteValidationAchat2,
        StatutDemande.EnAttenteValidationChef,
        StatutDemande.EnAttenteValidationFinance,
        StatutDemande.EnAttenteConfirmationFinance,
        StatutDemande.EnAttenteValidationDirecteur
    };

    private async Task<double> CalculateResteBudgetAsync(int Id, double budgetTotal)
    {
        var consomme = await _context.DetailDemandes
            .AsNoTracking()
            .Where(dd => dd.Demande.CapexId == Id && StatutsEngages.Contains(dd.Demande.Statut))
            .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
        return budgetTotal - consomme;
    }

    public async Task RecalculerResteBudgetAsync()
    {
        var capexes = await _context.Capexes.ToListAsync();
        foreach (var c in capexes)
        {
            var consomme = await _context.DetailDemandes
                .Where(dd => dd.Demande.CapexId == c.Id && StatutsEngages.Contains(dd.Demande.Statut))
                .SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
            c.BudgetRestant = c.BudgetTotal - consomme;
        }
        await _context.SaveChangesAsync();
    }

    public async Task<Capex> CreateCapexAsync(CreateCapexDto dto)
    {
        if (dto.BudgetTotal < 0)
            throw new BusinessException("Le budget total ne peut pas être négatif.");

        var entity = new EfCapex
        {
            NomCapex = dto.NomCapex,
            BudgetTotal = dto.BudgetTotal,
            BudgetRestant = dto.BudgetTotal
        };

        _context.Capexes.Add(entity);
        await _context.SaveChangesAsync();

        return MapToModel(entity, entity.BudgetRestant);
    }

    public async Task<ConsommationCapexDto?> GetConsommationAsync(int Id, DateTime? from = null, DateTime? to = null)
    {
        var entity = await _context.Capexes.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == Id);
        if (entity is null) return null;

        // Consommation = BonDeCommande + toutes les demandes en attente (engagé / réservé)
        var parDepartementQuery = _context.DetailDemandes.AsNoTracking()
            .Where(dd => dd.Demande.CapexId == Id && StatutsEngages.Contains(dd.Demande.Statut));
        if (from != null) parDepartementQuery = parDepartementQuery.Where(dd => dd.Demande.CreatedAt >= from);
        if (to != null) { var toEnd = to.Value.Date.AddDays(1).AddTicks(-1); parDepartementQuery = parDepartementQuery.Where(dd => dd.Demande.CreatedAt <= toEnd); }

        var parDepartement = await parDepartementQuery
            .GroupBy(dd => dd.Demande.Utilisateur.Departement.Nom)
            .Select(g => new ConsommationDepartementDto
            {
                DepartementNom = g.Key,
                MontantConsomme = g.Sum(dd => dd.Quantite * (dd.Prix ?? 0))
            })
            .OrderByDescending(x => x.MontantConsomme)
            .ToListAsync();

        var statutsEnAttente = new[]
        {
            StatutDemande.EnAttenteValidationAchat1,
            StatutDemande.EnAttenteValidationAchat2,
            StatutDemande.EnAttenteValidationChef,
            StatutDemande.EnAttenteValidationFinance,
            StatutDemande.EnAttenteConfirmationFinance,
            StatutDemande.EnAttenteValidationDirecteur
        };

        var enAttenteQuery = _context.DetailDemandes.AsNoTracking()
            .Where(dd => dd.Demande.CapexId == Id && statutsEnAttente.Contains(dd.Demande.Statut));
        if (from != null) enAttenteQuery = enAttenteQuery.Where(dd => dd.Demande.CreatedAt >= from);
        if (to != null) { var toEnd = to.Value.Date.AddDays(1).AddTicks(-1); enAttenteQuery = enAttenteQuery.Where(dd => dd.Demande.CreatedAt <= toEnd); }
        var montantEnAttente = await enAttenteQuery.SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;

        var resteCalculeQuery = _context.DetailDemandes.AsNoTracking().Where(dd => dd.Demande.CapexId == Id && StatutsEngages.Contains(dd.Demande.Statut));
        if (from != null) resteCalculeQuery = resteCalculeQuery.Where(dd => dd.Demande.CreatedAt >= from);
        if (to != null) { var toEnd = to.Value.Date.AddDays(1).AddTicks(-1); resteCalculeQuery = resteCalculeQuery.Where(dd => dd.Demande.CreatedAt <= toEnd); }
        var consommeFiltre = await resteCalculeQuery.SumAsync(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0;
        var resteCalcule = entity.BudgetTotal - consommeFiltre;
        var stocke = entity.BudgetRestant;

        return new ConsommationCapexDto
        {
            Id = entity.Id,
            NomCapex = entity.NomCapex,
            BudgetTotal = entity.BudgetTotal,
            BudgetRestant = resteCalcule,
            BudgetRestantStocke = stocke,
            BudgetRestantCalcule = resteCalcule,
            ResteBudgetIncoherent = stocke != resteCalcule,
            MontantEnAttente = montantEnAttente,
            ParDepartement = parDepartement
        };
    }

    private static Capex MapToModel(EfCapex entity, double resteCalcule) => new()
    {
        Id = entity.Id,
        NomCapex = entity.NomCapex,
        BudgetTotal = entity.BudgetTotal,
        BudgetRestant = resteCalcule
    };
    private static Capex MapToModel(EfCapex entity) => new()
    {
        Id = entity.Id,
        NomCapex = entity.NomCapex,
        BudgetTotal = entity.BudgetTotal,
        BudgetRestant = entity.BudgetRestant
    };
}
