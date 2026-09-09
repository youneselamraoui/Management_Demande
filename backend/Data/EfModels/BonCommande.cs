using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Data.EfModels;

[Table("BonCommandes")]
public class BonCommande
{
    [Key] public int Id { get; set; }
    public int DemandeId { get; set; }
    [StringLength(50)] public string? Po { get; set; }
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    public int FournisseurId { get; set; }
    [ForeignKey(nameof(DemandeId))] public virtual Demande Demande { get; set; } = null!;
    [ForeignKey(nameof(FournisseurId))] public virtual Fournisseur Fournisseur { get; set; } = null!;
}