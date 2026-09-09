// DTOs/ConsommationCapexDto.cs
namespace backend.DTOs;
using System.Text.Json.Serialization;

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
    public decimal BudgetRestant { get; set; }
    [JsonIgnore]
    public decimal ResteBudget { get => BudgetRestant; set => BudgetRestant = value; }
    public decimal BudgetRestantStocke { get; set; }
    public decimal BudgetRestantCalcule { get; set; }
    public bool ResteBudgetIncoherent { get; set; }
    public decimal MontantEnAttente { get; set; }
    public List<ConsommationDepartementDto> ParDepartement { get; set; } = new();
}