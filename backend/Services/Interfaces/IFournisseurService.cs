using backend.DTOs;

namespace backend.Services.Interfaces;

public interface IFournisseurService
{
    Task<List<FournisseurStatDto>> GetAllFournisseursAsync();
    Task<FournisseurStatsResponseDto> GetStatsAsync(DateTime? from, DateTime? to);
    Task<FournisseurStatDto?> GetStatsByIdAsync(int id, DateTime? from, DateTime? to);
    Task<FournisseurStatDto> CreateAsync(CreateFournisseurDto dto);
}
