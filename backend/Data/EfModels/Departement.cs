using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

[Table("Departements")]
public partial class Departement
{
    [Key]
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string Nom { get; set; } = null!;

    [InverseProperty("Departement")]
    public virtual ICollection<Utilisateur> Utilisateurs { get; set; } = new List<Utilisateur>();
}
