namespace backend.DTOs;

public class CreateCapexDto
{
    public string NomCapex { get; set; } = string.Empty;
    public double BudgetTotal { get; set; }
}