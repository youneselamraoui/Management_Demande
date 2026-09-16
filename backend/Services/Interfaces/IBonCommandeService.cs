using backend.DTOs;

namespace backend.Services.Interfaces;

public interface IBonCommandeService
{
    Task<List<BonCommandeDto>> GetAllAsync();
    Task<BonCommandeDto?> GetByIdAsync(int id);
    Task<BonCommandeDto> CreateAsync(CreateBonCommandeDto dto);
    Task<BonCommandeDto> UpdateCheminFinanceAsync(int id, string? cheminFinance);
}
