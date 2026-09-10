using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConvertAllNvarcharToMax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name='UQ_NomU' AND parent_object_id=OBJECT_ID('Utilisateurs')) ALTER TABLE [Utilisateurs] DROP CONSTRAINT [UQ_NomU]; IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_NomU' AND object_id=OBJECT_ID('Utilisateurs')) DROP INDEX [UQ_NomU] ON [Utilisateurs];");
            migrationBuilder.Sql(@"IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name='UQ_Nom' AND parent_object_id=OBJECT_ID('Departements')) ALTER TABLE [Departements] DROP CONSTRAINT [UQ_Nom]; IF EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_Nom' AND object_id=OBJECT_ID('Departements')) DROP INDEX [UQ_Nom] ON [Departements];");

            migrationBuilder.AlterColumn<string>(
                name: "Nom",
                table: "Utilisateurs",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Nom",
                table: "Departements",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Nom",
                table: "Utilisateurs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Nom",
                table: "Departements",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            // Unique non recréé car nvarchar(max) ne le supporte pas - laisser sans contrainte en Down simplifié
        }
    }
}
