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

    [Column("DepartementID")]
    public int DepartementId { get; set; }

    [InverseProperty("Utilisateur")]
    public virtual ICollection<Demande> Demandes { get; set; } = new List<Demande>();

    [ForeignKey("DepartementId")]
    [InverseProperty("Utilisateurs")]
    public virtual Departement Departement { get; set; } = null!;
}
