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
        var entity = await _context.Capexes.FindAsync(id);
        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<Capex>> GetAllCapexAsync()
    {
        var entities = await _context.Capexes.AsNoTracking().ToListAsync();
        return entities.Select(MapToModel).ToList();
    }

    public async Task<Capex> CreateCapexAsync(CreateCapexDto dto)
    {
        if (dto.BudgetTotal < 0)
            throw new BusinessException("Le budget total ne peut pas être négatif.");

        var entity = new EfCapex
        {
            NomCapex = dto.NomCapex,
            BudgetTotal = dto.BudgetTotal,
            ResteBudget = dto.BudgetTotal
        };

        _context.Capexes.Add(entity);
        await _context.SaveChangesAsync();

        return MapToModel(entity);
    }

    public async Task<ConsommationCapexDto?> GetConsommationAsync(int capexId)
    {
        var entity = await _context.Capexes.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CapexId == capexId);
        if (entity is null) return null;

        var parDepartement = await _context.DetailDemandes
            .AsNoTracking()
            .Where(dd => dd.Demande.CapexId == capexId && dd.Demande.Statut == StatutDemande.Acceptee)
            .GroupBy(dd => dd.Demande.Utilisateur.Departement.Nom)
            .Select(g => new ConsommationDepartementDto
            {
                DepartementNom = g.Key,
                MontantConsomme = g.Sum(dd => dd.Quantite * dd.Prix)
            })
            .OrderByDescending(x => x.MontantConsomme)
            .ToListAsync();

        var montantEnAttente = await _context.DetailDemandes
            .AsNoTracking()
            .Where(dd => dd.Demande.CapexId == capexId && dd.Demande.Statut == StatutDemande.EnAttente)
            .SumAsync(dd => (decimal?)(dd.Quantite * dd.Prix)) ?? 0m;

        return new ConsommationCapexDto
        {
            CapexId = entity.CapexId,
            NomCapex = entity.NomCapex,
            BudgetTotal = entity.BudgetTotal,
            ResteBudget = entity.ResteBudget,
            MontantEnAttente = montantEnAttente,
            ParDepartement = parDepartement
        };
    }

    private static Capex MapToModel(EfCapex entity) => new()
    {
        CapexId = entity.CapexId,
        NomCapex = entity.NomCapex,
        BudgetTotal = entity.BudgetTotal,
        ResteBudget = entity.ResteBudget
    };
}