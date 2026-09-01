// Services/DemandeService.cs
using backend.Data.Repositories;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class DemandeService : IDemandeService
{
    private readonly IDemandeRepository _repo;
    private readonly ICapexRepository _capexRepo;

    public DemandeService(IDemandeRepository repo, ICapexRepository capexRepo)
    {
        _repo = repo;
        _capexRepo = capexRepo;
    }

    public Task<Demande?> GetDemandeAsync(int id) => _repo.GetByIdAsync(id);
    public Task<List<Demande>> GetAllDemandesAsync() => _repo.GetAllAsync();

    public async Task<Demande> CreateDemandeAsync(CreateDemandeDto dto)
    {
        var capex = await _capexRepo.GetByIdAsync(dto.CapexId);
        if (capex is null)
            throw new BusinessException($"Le Capex {dto.CapexId} n'existe pas.");

        var demande = new Demande
        {
            UtilisateurId = dto.UtilisateurId,
            CapexId = dto.CapexId,
            RFx = dto.RFx,
            Statut = StatutDemande.EnAttente,
            CreateAt = DateTime.UtcNow
        };

        var newId = await _repo.AddAsync(demande);
        demande.IdDemande = newId;
        return demande;
    }

    public async Task ValiderParChefAsync(int demandeId)
    {
        var demande = await GetDemandeOuThrow(demandeId);
        if (demande.DateValidateChef is not null)
            throw new BusinessException("Déjà validée par le chef.");

        demande.DateValidateChef = DateTime.UtcNow;
        await FinaliserSiComplet(demande);
    }

    public async Task ValiderParFinanceAsync(int demandeId)
    {
        var demande = await GetDemandeOuThrow(demandeId);
        if (demande.DateValidateFinance is not null)
            throw new BusinessException("Déjà validée par la finance.");

        demande.DateValidateFinance = DateTime.UtcNow;
        await FinaliserSiComplet(demande);
    }

    public async Task ValiderParDirecteurAsync(int demandeId)
    {
        var demande = await GetDemandeOuThrow(demandeId);
        if (demande.DateValidateDirecteur is not null)
            throw new BusinessException("Déjà validée par le directeur.");

        demande.DateValidateDirecteur = DateTime.UtcNow;
        await FinaliserSiComplet(demande);
    }

    public async Task RejeterAsync(int demandeId)
    {
        var demande = await GetDemandeOuThrow(demandeId);
        if (demande.Statut == StatutDemande.Rejetee)
            throw new BusinessException("Cette demande est déjà rejetée.");
        if (demande.Statut == StatutDemande.Acceptee)
            throw new BusinessException("Cette demande est déjà acceptée, elle ne peut plus être rejetée.");

        demande.Statut = StatutDemande.Rejetee;
        await _repo.UpdateAsync(demande);
    }

    private async Task<Demande> GetDemandeOuThrow(int demandeId)
    {
        var demande = await _repo.GetByIdAsync(demandeId);
        if (demande is null) throw new BusinessException("Demande introuvable.");
        if (demande.Statut == StatutDemande.Rejetee)
            throw new BusinessException("Cette demande a été rejetée, aucune validation possible.");
        return demande;
    }

    private async Task FinaliserSiComplet(Demande demande)
    {
        if (demande.DateValidateChef is not null
            && demande.DateValidateFinance is not null
            && demande.DateValidateDirecteur is not null)
        {
            demande.Statut = StatutDemande.Acceptee;
        }

        await _repo.UpdateAsync(demande);
    }
}