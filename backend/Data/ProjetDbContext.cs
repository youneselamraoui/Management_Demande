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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Capex>(entity =>
        {
            entity.HasKey(e => e.CapexId).HasName("PK__Capex__120BD429C6355FB6");
            entity.ToTable("Capexes");
        });

        modelBuilder.Entity<Demande>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Demande__8CE9A8CAB33538E6");
            entity.ToTable("Demandes");

            entity.Property(e => e.CreatedAt).IsRequired();

            entity.Property(e => e.Statut)
                .HasConversion<string>()
                .HasMaxLength(50);

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
            entity.HasOne(d => d.Departement).WithMany(p => p.Utilisateurs)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Utilisateur_Departement");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
