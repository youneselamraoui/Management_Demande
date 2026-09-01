using backend.Data.Repositories;
using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;


namespace backend.Services;

public class CapexService : ICapexService
{
    private readonly ICapexRepository _repo;
    public CapexService(ICapexRepository repo) => _repo = repo;

    public Task<Capex?> GetCapexAsync(int id) => _repo.GetByIdAsync(id);
    public Task<List<Capex>> GetAllCapexAsync() => _repo.GetAllAsync();

    public async Task<Capex> CreateCapexAsync(CreateCapexDto dto)
    {
        if (dto.BudgetTotal < 0)
            throw new BusinessException("Le budget total ne peut pas être négatif.");

        // Règle métier : à la création, le reste = le total (rien n'est encore dépensé)
        var capex = new Capex
        {
            NomCapex = dto.NomCapex,
            BudgetTotal = dto.BudgetTotal,
            ResteBudget = dto.BudgetTotal
        };

        var newId = await _repo.AddAsync(capex);
        capex.CapexId = newId;
        return capex;
    }

   public async Task<ConsommationCapexDto?> GetConsommationAsync(int capexId)
{
    var capex = await _repo.GetByIdAsync(capexId);
    if (capex is null) return null;

    var parDepartement = await _repo.GetConsommationParDepartementAsync(capexId);

    return new ConsommationCapexDto
    {
        CapexId = capex.CapexId,
        NomCapex = capex.NomCapex,
        BudgetTotal = capex.BudgetTotal,
        ResteBudget = capex.ResteBudget,
        ParDepartement = parDepartement
    };
}

    Task<ConsommationCapexDto?> ICapexService.GetConsommationAsync(int capexId)
    {
        throw new NotImplementedException();
    }
}