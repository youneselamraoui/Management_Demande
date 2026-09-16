using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfBonCommande = backend.Data.EfModels.BonCommande;

namespace backend.Services;

public class BonCommandeService : IBonCommandeService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public BonCommandeService(backend.Data.EfModels.ProjetDbContext context) => _context = context;

    public async Task<List<BonCommandeDto>> GetAllAsync()
    {
        var list = await _context.BonCommandes
            .Include(b => b.Fournisseur)
            .AsNoTracking()
            .OrderByDescending(b => b.DateCreation)
            .ToListAsync();
        return list.Select(Map).ToList();
    }

    public async Task<BonCommandeDto?> GetByIdAsync(int id)
    {
        var e = await _context.BonCommandes
            .Include(b => b.Fournisseur)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);
        return e is null ? null : Map(e);
    }

    public async Task<BonCommandeDto> CreateAsync(CreateBonCommandeDto dto)
    {
        var demande = await _context.Demandes.AsNoTracking().FirstOrDefaultAsync(d => d.Id == dto.DemandeId);
        if (demande is null) throw new BusinessException($"Demande {dto.DemandeId} introuvable.");

        var fournisseur = await _context.Fournisseurs.AsNoTracking().FirstOrDefaultAsync(f => f.Id == dto.FournisseurId);
        if (fournisseur is null) throw new BusinessException($"Fournisseur {dto.FournisseurId} introuvable.");

        var entity = new EfBonCommande
        {
            DemandeId = dto.DemandeId,
            Po = dto.Po,
            CheminFinance = dto.CheminFinance,
            FournisseurId = dto.FournisseurId,
            DateCreation = DateTime.UtcNow
        };
        _context.BonCommandes.Add(entity);
        await _context.SaveChangesAsync();
        entity.Fournisseur = fournisseur;
        return Map(entity);
    }

    public async Task<BonCommandeDto> UpdateCheminFinanceAsync(int id, string? cheminFinance)
    {
        var entity = await _context.BonCommandes
            .Include(b => b.Fournisseur)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (entity is null) throw new BusinessException($"Bon de commande {id} introuvable.");

        entity.CheminFinance = string.IsNullOrWhiteSpace(cheminFinance) ? null : cheminFinance.Trim();
        await _context.SaveChangesAsync();

        return Map(entity);
    }

    private static BonCommandeDto Map(EfBonCommande e) => new()
    {
        Id = e.Id,
        DemandeId = e.DemandeId,
        Po = e.Po,
        CheminFinance = e.CheminFinance,
        DateCreation = e.DateCreation,
        FournisseurId = e.FournisseurId,
        FournisseurNom = e.Fournisseur?.Nom ?? string.Empty,
        StatutDemande = string.Empty
    };
}
