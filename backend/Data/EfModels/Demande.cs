using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using backend.Models; 

namespace backend.Data.EfModels;

[Table("Demande")]
public partial class Demande
{
    [Key]
    [Column("idDemande")]
    public int IdDemande { get; set; }

    public int UtilisateurId { get; set; }

    [StringLength(50)]
    public StatutDemande Statut { get; set; }
    public int CapexId { get; set; }

    [Column("RFx")]
    [StringLength(50)]
    public string? Rfx { get; set; }

    public DateTime CreateAt { get; set; }

    public DateTime? DateValidation1 { get; set; }

    public DateTime? DateValidation2 { get; set; }

    public DateTime? DateValidateChef { get; set; }

    public DateTime? DateValidateFinance { get; set; }

    public DateTime? DateValidateDirecteur { get; set; }

    [ForeignKey("CapexId")]
    [InverseProperty("Demandes")]
    public virtual Capex Capex { get; set; } = null!;

    [InverseProperty("Demande")]
    public virtual ICollection<DetailDemande> DetailDemandes { get; set; } = new List<DetailDemande>();

    [ForeignKey("UtilisateurId")]
    [InverseProperty("Demandes")]
    public virtual Utilisateur Utilisateur { get; set; } = null!;
}
