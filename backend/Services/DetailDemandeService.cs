using backend.Data.Repositories;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class DetailDemandeService : IDetailDemandeService
{
    private readonly IDetailDemandeRepository _repo;
    private readonly IDemandeRepository _demandeRepo;

    public DetailDemandeService(IDetailDemandeRepository repo, IDemandeRepository demandeRepo)
    {
        _repo = repo;
        _demandeRepo = demandeRepo;
    }

    public Task<DetailDemande?> GetDetailAsync(int id) => _repo.GetByIdAsync(id);
    public Task<List<DetailDemande>> GetByDemandeIdAsync(int demandeId) => _repo.GetByDemandeIdAsync(demandeId);

    public async Task<DetailDemande> CreateDetailAsync(CreateDetailDemandeDto dto)
    {
        // Règle métier : vérifier que la Demande parente existe
        var demande = await _demandeRepo.GetByIdAsync(dto.DemandeId);
        if (demande is null)
            throw new BusinessException($"La demande {dto.DemandeId} n'existe pas.");

        if (dto.Quantite <= 0)
            throw new BusinessException("La quantité doit être supérieure à 0.");
        if (dto.Prix < 0)
            throw new BusinessException("Le prix ne peut pas être négatif.");

        var detail = new DetailDemande
        {
            DemandeId = dto.DemandeId,
            Article = dto.Article,
            Quantite = dto.Quantite,
            Prix = dto.Prix,
            Devis = dto.Devis
        };

        var newId = await _repo.AddAsync(detail);
        detail.Id = newId;
        return detail;
    }
}