using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

[Table("Capex")]
public partial class Capex
{
    [Key]
    public int CapexId { get; set; }

    [StringLength(200)]
    public string NomCapex { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal BudgetTotal { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal ResteBudget { get; set; }

    [InverseProperty("Capex")]
    public virtual ICollection<Demande> Demandes { get; set; } = new List<Demande>();
}
