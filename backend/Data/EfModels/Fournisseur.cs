using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Data.EfModels;

[Table("Fournisseurs")]
public class Fournisseur
{
    [Key] public int Id { get; set; }
    [Column(TypeName = "nvarchar(max)")] public string Nom { get; set; } = null!;
    public virtual ICollection<BonCommande> BonCommandes { get; set; } = new List<BonCommande>();
}