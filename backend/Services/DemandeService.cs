// Services/DemandeService.cs
using backend.Data.Repositories;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class DemandeService : IDemandeService
{
    private readonly IDemandeRepository _repo;
    private readonly IUtilisateurRepository _utilisateurRepo;
    private readonly ICapexRepository _capexRepo;

    public DemandeService(IDemandeRepository repo, IUtilisateurRepository utilisateurRepo, ICapexRepository capexRepo)
    {
        _repo = repo;
        _utilisateurRepo = utilisateurRepo;
        _capexRepo = capexRepo;
    }

    public Task<Demande?> GetDemandeAsync(int id) => _repo.GetByIdAsync(id);
    public Task<List<Demande>> GetAllDemandesAsync() => _repo.GetAllAsync();

    public async Task<Demande> CreateDemandeAsync(CreateDemandeDto dto)
    {
        if (await _utilisateurRepo.GetByIdAsync(dto.UtilisateurId) is null)
            throw new BusinessException($"L'utilisateur {dto.UtilisateurId} n'existe pas.");
        if (await _capexRepo.GetByIdAsync(dto.CapexId) is null)
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

        var demande = new Demande
        {
            UtilisateurId = dto.UtilisateurId,
            CapexId = dto.CapexId,
            RFx = dto.RFx,
            Statut = StatutDemande.EnAttente
        };

        var details = dto.Articles.Select(a => new DetailDemande
        {
            Article = a.Article,
            Quantite = a.Quantite,
            Prix = a.Prix,
            Devis = a.Devis
        }).ToList();

        var newId = await _repo.AddWithDetailsAsync(demande, details);
        return (await _repo.GetByIdAsync(newId))!;
    }
}