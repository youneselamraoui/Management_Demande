using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

[Table("DetailsDemandes")]
public partial class DetailDemande
{
    [Key]
    public int Id { get; set; }

    public int DemandeId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Article { get; set; } = null!;

    public int Quantite { get; set; }

    [Column(TypeName = "float")]
    public double? Prix { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Devis { get; set; }

    [ForeignKey("DemandeId")]
    [InverseProperty("DetailDemandes")]
    public virtual Demande Demande { get; set; } = null!;
}
