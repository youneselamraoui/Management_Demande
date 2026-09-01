namespace backend.DTOs;

public class CreateCapexDto
{
    public string NomCapex { get; set; } = string.Empty;
    public decimal BudgetTotal { get; set; }
}