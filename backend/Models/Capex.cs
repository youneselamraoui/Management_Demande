namespace backend.Models;
using System.Text.Json.Serialization;

public class Capex
{
    public int CapexId { get; set; }
    public string NomCapex { get; set; } = string.Empty;
    public decimal BudgetTotal { get; set; }
    public decimal BudgetRestant { get; set; }
    [JsonIgnore]
    public decimal ResteBudget { get => BudgetRestant; set => BudgetRestant = value; }
}