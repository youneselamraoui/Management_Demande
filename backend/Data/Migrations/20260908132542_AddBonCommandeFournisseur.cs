using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBonCommandeFournisseur : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Renommages déjà effectués via Program.cs sp_rename pour base existante
            // On garde uniquement la création des nouvelles tables
            migrationBuilder.CreateTable(
                name: "Fournisseurs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fournisseurs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BonCommandes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DemandeId = table.Column<int>(type: "int", nullable: false),
                    Po = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FournisseurId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BonCommandes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BonCommandes_Demandes_DemandeId",
                        column: x => x.DemandeId,
                        principalTable: "Demandes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BonCommandes_Fournisseurs_FournisseurId",
                        column: x => x.FournisseurId,
                        principalTable: "Fournisseurs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BonCommandes_DemandeId",
                table: "BonCommandes",
                column: "DemandeId");

            migrationBuilder.CreateIndex(
                name: "IX_BonCommandes_FournisseurId",
                table: "BonCommandes",
                column: "FournisseurId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BonCommandes");

            migrationBuilder.DropTable(
                name: "Fournisseurs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Demandes");

            migrationBuilder.RenameTable(
                name: "Utilisateurs",
                newName: "Utilisateur");

            migrationBuilder.RenameTable(
                name: "DetailsDemandes",
                newName: "DetailDemande");

            migrationBuilder.RenameTable(
                name: "Departements",
                newName: "Departement");

            migrationBuilder.RenameTable(
                name: "Demandes",
                newName: "Demande");

            migrationBuilder.RenameTable(
                name: "Capexes",
                newName: "Capex");

            migrationBuilder.RenameIndex(
                name: "IX_Utilisateurs_DepartementID",
                table: "Utilisateur",
                newName: "IX_Utilisateur_DepartementID");

            migrationBuilder.RenameIndex(
                name: "IX_DetailsDemandes_DemandeId",
                table: "DetailDemande",
                newName: "IX_DetailDemande_DemandeId");

            migrationBuilder.RenameColumn(
                name: "RFX",
                table: "Demande",
                newName: "RFx");

            migrationBuilder.RenameColumn(
                name: "DateValidationAchat2",
                table: "Demande",
                newName: "DateValidation2");

            migrationBuilder.RenameColumn(
                name: "DateValidationAchat1",
                table: "Demande",
                newName: "DateValidation1");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Demande",
                newName: "idDemande");

            migrationBuilder.RenameIndex(
                name: "IX_Demandes_UtilisateurId",
                table: "Demande",
                newName: "IX_Demande_UtilisateurId");

            migrationBuilder.RenameIndex(
                name: "IX_Demandes_Id",
                table: "Demande",
                newName: "IX_Demande_Id");

            migrationBuilder.RenameColumn(
                name: "BudgetRestant",
                table: "Capex",
                newName: "ResteBudget");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateAt",
                table: "Demande",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "(getdate())");
        }
    }
}
