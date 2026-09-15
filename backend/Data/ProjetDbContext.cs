using System;
using System.Collections.Generic;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data.EfModels;

public partial class ProjetDbContext : DbContext
{
    public ProjetDbContext()
    {
    }

    public ProjetDbContext(DbContextOptions<ProjetDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Capex> Capexes { get; set; }

    public virtual DbSet<Demande> Demandes { get; set; }

    public virtual DbSet<Departement> Departements { get; set; }

    public virtual DbSet<DetailDemande> DetailDemandes { get; set; }

    public virtual DbSet<Utilisateur> Utilisateurs { get; set; }
    public virtual DbSet<Fournisseur> Fournisseurs {get;set;}
    public virtual DbSet<BonCommande> BonCommandes {get;set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Capex>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Capex__120BD429C6355FB6");
            entity.ToTable("Capexes");
        });

        modelBuilder.Entity<Demande>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Demande__8CE9A8CAB33538E6");
            entity.ToTable("Demandes");

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.Commentaire).HasColumnType("nvarchar(max)");
            entity.Property(e => e.MontantReserve).HasColumnType("float");
            entity.Property(e => e.CheminDevis).HasColumnType("nvarchar(max)");
            entity.Property(e => e.CheminSAP).HasColumnType("nvarchar(max)");
            entity.Property(e => e.CheminFinance).HasColumnType("nvarchar(max)");
            entity.Property(e => e.FichierPath).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Justification).HasColumnType("nvarchar(max)");

            entity.Property(e => e.Statut)
                .HasConversion(
                    v => v.ToDisplay(),
                    v => StatutDemandeExtensions.ParseStatut(v))
                .HasColumnType("nvarchar(max)");

            entity.HasOne(d => d.Capex).WithMany(p => p.Demandes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Demande_Capex");

            entity.HasOne(d => d.Utilisateur).WithMany(p => p.Demandes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Demande_Utilisateur");
        });

        modelBuilder.Entity<Departement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Departem__3214EC075C2917C8");
        });

        modelBuilder.Entity<DetailDemande>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DetailDe__3214EC07CD94415F");
            entity.ToTable("DetailsDemandes");
            entity.HasOne(d => d.Demande).WithMany(p => p.DetailDemandes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DetailDemande_Demande");
        });

        modelBuilder.Entity<Utilisateur>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Utilisat__3214EC075DBA5179");
            entity.ToTable("Utilisateurs");
            entity.Property(e => e.Nom).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Email).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.MotDePasse).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Role).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(e => e.Active).IsRequired();
            entity.HasOne(d => d.Departement).WithMany(p => p.Utilisateurs)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Utilisateur_Departement");
            entity.HasOne(d => d.Chef).WithMany(p => p.Subordonnes)
                .HasForeignKey(d => d.ChefId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Utilisateur_Chef");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
