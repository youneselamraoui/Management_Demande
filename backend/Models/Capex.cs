namespace backend.Models;
using System.Text.Json.Serialization;

public class Capex
{
    public int Id { get; set; }
    [JsonIgnore]
    public int CapexId { get => Id; set => Id = value; }
    public string NomCapex { get; set; } = string.Empty;
    public double BudgetTotal { get; set; }
    public double BudgetRestant { get; set; }
    [JsonIgnore]
    public double ResteBudget { get => BudgetRestant; set => BudgetRestant = value; }
}