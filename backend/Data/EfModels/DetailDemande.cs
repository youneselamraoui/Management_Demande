using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

[Table("DetailDemande")]
public partial class DetailDemande
{
    [Key]
    public int Id { get; set; }

    public int DemandeId { get; set; }

    [StringLength(200)]
    public string Article { get; set; } = null!;

    public int Quantite { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Prix { get; set; }

    [StringLength(200)]
    public string? Devis { get; set; }

    [ForeignKey("DemandeId")]
    [InverseProperty("DetailDemandes")]
    public virtual Demande Demande { get; set; } = null!;
}
