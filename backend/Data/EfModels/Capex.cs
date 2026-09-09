using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

[Table("Capexes")]
public partial class Capex
{
    [Key]
    public int CapexId { get; set; }

    [StringLength(200)]
    public string NomCapex { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal BudgetTotal { get; set; }

    [Column("BudgetRestant", TypeName = "decimal(18, 2)")]
    public decimal BudgetRestant { get; set; }

    // Compat : ancien nom (non mappé, proxy vers BudgetRestant)
    [NotMapped]
    public decimal ResteBudget { get => BudgetRestant; set => BudgetRestant = value; }

    [InverseProperty("Capex")]
    public virtual ICollection<Demande> Demandes { get; set; } = new List<Demande>();
}
