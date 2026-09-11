using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeCapexIdNullable2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Demande_Capex",
                table: "Demandes");

            migrationBuilder.AlterColumn<int>(
                name: "CapexId",
                table: "Demandes",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Demande_Capex",
                table: "Demandes",
                column: "CapexId",
                principalTable: "Capexes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Demande_Capex",
                table: "Demandes");

            migrationBuilder.AlterColumn<int>(
                name: "CapexId",
                table: "Demandes",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Demande_Capex",
                table: "Demandes",
                column: "CapexId",
                principalTable: "Capexes",
                principalColumn: "Id");
        }
    }
}
