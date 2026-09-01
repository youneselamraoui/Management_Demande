// DTOs/ConsommationCapexDto.cs
namespace backend.DTOs;

public class ConsommationDepartementDto
{
    public string DepartementNom { get; set; } = string.Empty;
    public decimal MontantConsomme { get; set; }
}

public class ConsommationCapexDto
{
    public int CapexId { get; set; }
    public string NomCapex { get; set; } = string.Empty;
    public decimal BudgetTotal { get; set; }
    public decimal ResteBudget { get; set; }
    public List<ConsommationDepartementDto> ParDepartement { get; set; } = new();
}