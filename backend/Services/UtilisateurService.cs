// Services/UtilisateurService.cs
using backend.Data.Repositories;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class UtilisateurService : IUtilisateurService
{
    private readonly IUtilisateurRepository _repo;
    private readonly IDepartementRepository _departementRepo;

    public UtilisateurService(IUtilisateurRepository repo, IDepartementRepository departementRepo)
    {
        _repo = repo;
        _departementRepo = departementRepo;
    }

    public Task<Utilisateur?> GetUtilisateurAsync(int id) => _repo.GetByIdAsync(id);
    public Task<List<Utilisateur>> GetAllUtilisateursAsync() => _repo.GetAllAsync();

    public async Task<Utilisateur> CreateUtilisateurAsync(CreateUtilisateurDto dto)
    {
        // Règle métier : vérifier que le département existe avant d'insérer
        var departement = await _departementRepo.GetByIdAsync(dto.DepartementID);
        if (departement is null)
            throw new BusinessException($"Le département {dto.DepartementID} n'existe pas.");

        var utilisateur = new Utilisateur { Nom = dto.Nom, DepartementID = dto.DepartementID };
        var newId = await _repo.AddAsync(utilisateur);
        utilisateur.Id = newId;
        utilisateur.DepartementNom = departement.Nom;
        return utilisateur;
    }
}