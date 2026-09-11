using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using backend.Models; 

namespace backend.Data.EfModels;

[Table("Demandes")]
public partial class Demande
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    // Compat : ancien PK idDemande -> proxy vers Id
    [NotMapped]
    public int IdDemande { get => Id; set => Id = value; }

    public int UtilisateurId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public StatutDemande Statut { get; set; }
    public int? CapexId { get; set; }

    [Column("RFX", TypeName = "nvarchar(max)")]
    public string? RFX { get; set; }

    // Compat RFx -> RFX (majuscule)
    [NotMapped]
    public string? Rfx { get => RFX; set => RFX = value; }

    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; }

    [NotMapped]
    public DateTime CreateAt { get => CreatedAt; set => CreatedAt = value; }

    [Column("DateValidationAchat1")]
    public DateTime? DateValidationAchat1 { get; set; }

    [NotMapped]
    public DateTime? DateValidation1 { get => DateValidationAchat1; set => DateValidationAchat1 = value; }

    [Column("DateValidationAchat2")]
    public DateTime? DateValidationAchat2 { get; set; }

    [NotMapped]
    public DateTime? DateValidation2 { get => DateValidationAchat2; set => DateValidationAchat2 = value; }

    public DateTime? DateValidateChef { get; set; }

    public DateTime? DateValidateFinance { get; set; }

    public DateTime? DateValidateDirecteur { get; set; }

    [ForeignKey("CapexId")]
    [InverseProperty("Demandes")]
    public virtual Capex? Capex { get; set; }

    [InverseProperty("Demande")]
    public virtual ICollection<DetailDemande> DetailDemandes { get; set; } = new List<DetailDemande>();

    [ForeignKey("UtilisateurId")]
    [InverseProperty("Demandes")]
    public virtual Utilisateur Utilisateur { get; set; } = null!;
}
