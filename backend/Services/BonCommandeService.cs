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
            .Include(b => b.Demande)
            .AsNoTracking()
            .OrderByDescending(b => b.DateCreation)
            .ToListAsync();

        var result = list.Select(Map).ToList();

        // Compléter sans rien changer en DB : si tu passes directement par SSMS
        // et mets Statut='BonDeCommande', on expose aussi ces demandes
        // même si la table BonCommandes n'a pas encore de ligne
        var existingDemandeIds = new HashSet<int>(result.Select(r => r.DemandeId));
        var missingDemandes = await _context.Demandes
            .AsNoTracking()
            .Where(d => d.Statut == backend.Models.StatutDemande.BonDeCommande && !existingDemandeIds.Contains(d.Id))
            .OrderByDescending(d => d.DateValidateDirecteur ?? d.CreatedAt)
            .ToListAsync();

        if (missingDemandes.Any())
        {
            var four = await _context.Fournisseurs.AsNoTracking().FirstOrDefaultAsync();
            var fourNom = four?.Nom ?? "—";
            var fourId = four?.Id ?? 0;
            var synthetic = missingDemandes.Select(d => new BonCommandeDto
            {
                Id = d.Id,
                DemandeId = d.Id,
                Po = $"PO-{d.Id:00000}",
                DateCreation = d.DateValidateDirecteur ?? d.CreatedAt,
                FournisseurId = fourId,
                FournisseurNom = fourNom,
                StatutDemande = d.Statut.ToString()
            });
            result.AddRange(synthetic);
            result = result.OrderByDescending(r => r.DateCreation).ToList();
        }

        return result;
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
            FournisseurId = dto.FournisseurId,
            DateCreation = DateTime.UtcNow
        };
        _context.BonCommandes.Add(entity);
        await _context.SaveChangesAsync();
        entity.Fournisseur = fournisseur;
        return Map(entity);
    }

    private static BonCommandeDto Map(EfBonCommande e) => new()
    {
        Id = e.Id,
        DemandeId = e.DemandeId,
        Po = e.Po,
        DateCreation = e.DateCreation,
        FournisseurId = e.FournisseurId,
        FournisseurNom = e.Fournisseur?.Nom ?? string.Empty,
        StatutDemande = e.Demande?.Statut.ToString() ?? string.Empty
    };
}
