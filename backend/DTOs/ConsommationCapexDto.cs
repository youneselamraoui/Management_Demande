// DTOs/ConsommationCapexDto.cs
namespace backend.DTOs;
using System.Text.Json.Serialization;

public class ConsommationDepartementDto
{
    public string DepartementNom { get; set; } = string.Empty;
    public double MontantConsomme { get; set; }
}

public class ConsommationCapexDto
{
    public int CapexId { get; set; }
    public string NomCapex { get; set; } = string.Empty;
    public double BudgetTotal { get; set; }
    public double BudgetRestant { get; set; }
    [JsonIgnore]
    public double ResteBudget { get => BudgetRestant; set => BudgetRestant = value; }
    public double BudgetRestantStocke { get; set; }
    public double BudgetRestantCalcule { get; set; }
    public bool ResteBudgetIncoherent { get; set; }
    public double MontantEnAttente { get; set; }
    public List<ConsommationDepartementDto> ParDepartement { get; set; } = new();
}