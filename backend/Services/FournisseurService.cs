using backend.DTOs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class FournisseurService : IFournisseurService
{
    private readonly backend.Data.EfModels.ProjetDbContext _context;
    public FournisseurService(backend.Data.EfModels.ProjetDbContext context) => _context = context;



    public async Task<List<FournisseurStatDto>> GetAllFournisseursAsync()
    {
        return await _context.Fournisseurs.AsNoTracking()
            .OrderBy(f => f.Nom)
            .Select(f => new FournisseurStatDto
            {
                FournisseurId = f.Id,
                FournisseurNom = f.Nom,
                NombreBonCommandes = 0,
                MontantTotal = 0
            }).ToListAsync();
    }

    public async Task<FournisseurStatsResponseDto> GetStatsAsync(DateTime? from, DateTime? to)
    {
        var query = _context.BonCommandes.AsNoTracking()
            .Include(b => b.Fournisseur)
            .Include(b => b.Demande).ThenInclude(d => d.DetailDemandes)
            .Include(b => b.Demande).ThenInclude(d => d.Utilisateur).ThenInclude(u => u.Departement)
            .AsQueryable();

        if (from != null) query = query.Where(b => b.DateCreation >= from.Value);
        if (to != null)
        {
            var toEnd = to.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(b => b.DateCreation <= toEnd);
        }

        // Matérialise : tous les BC sont BonDeCommande, on ignore le statut (refusées exclues par nature)
        var raw = await query.Select(b => new
        {
            b.Id,
            b.FournisseurId,
            FournisseurNom = b.Fournisseur != null ? b.Fournisseur.Nom : "Inconnu",
            b.DemandeId,
            b.Po,
            b.DateCreation,
            DepartementNom = b.Demande != null && b.Demande.Utilisateur != null && b.Demande.Utilisateur.Departement != null ? b.Demande.Utilisateur.Departement.Nom : "Inconnu",
            DemandeurNom = b.Demande != null && b.Demande.Utilisateur != null ? b.Demande.Utilisateur.Nom : "—",
            Montant = b.Demande != null ? b.Demande.DetailDemandes.Sum(dd => (double?)(dd.Quantite * (dd.Prix ?? 0))) ?? 0 : 0
        }).ToListAsync();

        var parFournisseur = raw
            .GroupBy(x => new { x.FournisseurId, x.FournisseurNom })
            .Select(g =>
            {
                var parDept = g.GroupBy(x => x.DepartementNom)
                    .Select(dg => new FournisseurDeptDto
                    {
                        DepartementNom = dg.Key,
                        NombreCommandes = dg.Count(),
                        MontantTotal = dg.Sum(x => x.Montant)
                    }).OrderByDescending(x => x.NombreCommandes).ToList();

                var commandes = g.OrderByDescending(x => x.DateCreation)
                    .Select(x => new FournisseurCommandeDetailDto
                    {
                        BonCommandeId = x.Id,
                        DemandeId = x.DemandeId,
                        Po = x.Po ?? "",
                        DateCreation = x.DateCreation,
                        DepartementNom = x.DepartementNom,
                        DemandeurNom = x.DemandeurNom,
                        Montant = x.Montant
                    }).ToList();

                return new FournisseurStatDto
                {
                    FournisseurId = g.Key.FournisseurId,
                    FournisseurNom = g.Key.FournisseurNom,
                    NombreBonCommandes = g.Count(),
                    MontantTotal = g.Sum(x => x.Montant),
                    MontantMoyen = g.Count() > 0 ? g.Sum(x => x.Montant) / g.Count() : 0,
                    DerniereCommande = g.Max(x => (DateTime?)x.DateCreation),
                    ParDepartement = parDept,
                    Commandes = commandes
                };
            })
            .OrderByDescending(x => x.MontantTotal)
            .ToList();

        // Inclure fournisseurs sans BC (0 commande)
        var allFournisseurs = await _context.Fournisseurs.AsNoTracking().ToListAsync();
        foreach (var f in allFournisseurs)
        {
            if (!parFournisseur.Any(p => p.FournisseurId == f.Id))
            {
                parFournisseur.Add(new FournisseurStatDto
                {
                    FournisseurId = f.Id,
                    FournisseurNom = f.Nom,
                    NombreBonCommandes = 0,
                    MontantTotal = 0,
                    MontantMoyen = 0,
                    DerniereCommande = null
                });
            }
        }
        parFournisseur = parFournisseur.OrderByDescending(x => x.MontantTotal).ToList();

        var totalBC = parFournisseur.Sum(x => x.NombreBonCommandes);
        var totalMontant = parFournisseur.Sum(x => x.MontantTotal);

        return new FournisseurStatsResponseDto
        {
            ParFournisseur = parFournisseur,
            TotalFournisseurs = allFournisseurs.Count,
            TotalBonCommandes = totalBC,
            MontantGlobal = totalMontant,
            MontantMoyenGlobal = totalBC > 0 ? totalMontant / totalBC : 0
        };
    }

    public async Task<FournisseurStatDto?> GetStatsByIdAsync(int id, DateTime? from, DateTime? to)
    {
        var stats = await GetStatsAsync(from, to);
        return stats.ParFournisseur.FirstOrDefault(x => x.FournisseurId == id);
    }

    public async Task<FournisseurStatDto> CreateAsync(CreateFournisseurDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nom))
            throw new BusinessException("Le nom du fournisseur est obligatoire.");
        var exists = await _context.Fournisseurs.AnyAsync(f => f.Nom.ToLower() == dto.Nom.Trim().ToLower());
        if (exists) throw new BusinessException("Ce fournisseur existe déjà.");
        var entity = new backend.Data.EfModels.Fournisseur { Nom = dto.Nom.Trim() };
        _context.Fournisseurs.Add(entity);
        await _context.SaveChangesAsync();
        return new FournisseurStatDto { FournisseurId = entity.Id, FournisseurNom = entity.Nom };
    }
}
