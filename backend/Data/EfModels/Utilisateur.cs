using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

[Table("Utilisateurs")]
public partial class Utilisateur
{
    [Key]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Nom { get; set; } = null!;

    [Column(TypeName = "nvarchar(max)")]
    public string Email { get; set; } = null!;

    [Column(TypeName = "nvarchar(max)")]
    public string MotDePasse { get; set; } = null!;

    [Column(TypeName = "nvarchar(max)")]
    public string Role { get; set; } = null!;

    [Column("DepartementID")]
    public int DepartementId { get; set; }

    [Column("ChefId")]
    public int? ChefId { get; set; }

    public bool Active { get; set; } = true;

    public bool? DoitChangerMotDePasse { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? EmailChef { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? NomChef { get; set; }

    [InverseProperty("Utilisateur")]
    public virtual ICollection<Demande> Demandes { get; set; } = new List<Demande>();

    [ForeignKey("DepartementId")]
    [InverseProperty("Utilisateurs")]
    public virtual Departement Departement { get; set; } = null!;

    [ForeignKey("ChefId")]
    [InverseProperty("Subordonnes")]
    public virtual Utilisateur? Chef { get; set; }

    [InverseProperty("Chef")]
    public virtual ICollection<Utilisateur> Subordonnes { get; set; } = new List<Utilisateur>();
}
