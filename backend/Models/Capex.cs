namespace backend.Models;

public class Capex
{
    public int CapexId { get; set; }
    public string NomCapex { get; set; } = string.Empty;
    public decimal BudgetTotal { get; set; }
    public decimal ResteBudget { get; set; }
}