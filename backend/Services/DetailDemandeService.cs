using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using EfDetailDemande = backend.Data.EfModels.DetailDemande;

namespace backend.Services;

public class DetailDemandeService : IDetailDemandeService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public DetailDemandeService(backend.Data.EfModels.ProjetDbContext context) => _context = context;

    public async Task<DetailDemande?> GetDetailAsync(int id)
    {
        var entity = await _context.DetailDemandes
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        return entity is null ? null : MapToModel(entity);
    }

    public async Task<List<DetailDemande>> GetByDemandeIdAsync(int demandeId)
    {
        var entities = await _context.DetailDemandes
            .AsNoTracking()
            .Where(d => d.DemandeId == demandeId)
            .ToListAsync();

        return entities.Select(MapToModel).ToList();
    }

    public async Task<DetailDemande> CreateDetailAsync(CreateDetailDemandeDto dto)
    {
        // Règle métier : vérifier que la Demande parente existe
        var demandeExiste = await _context.Demandes
            .AsNoTracking()
            .AnyAsync(d => d.IdDemande == dto.DemandeId);
        if (!demandeExiste)
            throw new BusinessException($"La demande {dto.DemandeId} n'existe pas.");

        if (dto.Quantite <= 0)
            throw new BusinessException("La quantité doit être supérieure à 0.");
        if (dto.Prix < 0)
            throw new BusinessException("Le prix ne peut pas être négatif.");

        var entity = new EfDetailDemande
        {
            DemandeId = dto.DemandeId,
            Article = dto.Article,
            Quantite = dto.Quantite,
            Prix = dto.Prix,
            Devis = dto.Devis
        };

        _context.DetailDemandes.Add(entity);
        await _context.SaveChangesAsync();

        return MapToModel(entity);
    }

    private static DetailDemande MapToModel(EfDetailDemande entity) => new()
    {
        Id = entity.Id,
        DemandeId = entity.DemandeId,
        Article = entity.Article,
        Quantite = entity.Quantite,
        Prix = entity.Prix,
        Devis = entity.Devis
    };
}