using Microsoft.Data.SqlClient;
using backend.Models;
using backend.DTOs;


namespace backend.Data.Repositories;

public class CapexRepository : ICapexRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public CapexRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string BaseSelect =
        "SELECT CapexId, NomCapex, BudgetTotal, ResteBudget FROM Capex";

    public async Task<Capex?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} WHERE CapexId = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapToCapex(reader);

        return null;
    }

    public async Task<List<Capex>> GetAllAsync()
    {
        var capexList = new List<Capex>();

        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(BaseSelect, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
            capexList.Add(MapToCapex(reader));

        return capexList;
    }

    public async Task<int> AddAsync(Capex capex)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(@"
            INSERT INTO Capex (NomCapex, BudgetTotal, ResteBudget)
            VALUES (@NomCapex, @BudgetTotal, @ResteBudget);
            SELECT CAST(SCOPE_IDENTITY() AS int);", connection);

        command.Parameters.AddWithValue("@NomCapex", capex.NomCapex);
        command.Parameters.AddWithValue("@BudgetTotal", capex.BudgetTotal);
        command.Parameters.AddWithValue("@ResteBudget", capex.ResteBudget);

        return (int)(await command.ExecuteScalarAsync())!;
    }

    // Diminue le budget restant — utilisé quand une Demande est validée définitivement.
    // La clause WHERE ResteBudget >= @Montant empêche un budget négatif au niveau SQL,
    // même en cas d'appels concurrents (protection contre les race conditions).
    public async Task<bool> DecrementerResteBudgetAsync(int capexId, decimal montant)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(@"
            UPDATE Capex
            SET ResteBudget = ResteBudget - @Montant
            WHERE CapexId = @CapexId AND ResteBudget >= @Montant", connection);

        command.Parameters.AddWithValue("@CapexId", capexId);
        command.Parameters.AddWithValue("@Montant", montant);

        return await command.ExecuteNonQueryAsync() > 0; // false = budget insuffisant
    }

    private static Capex MapToCapex(SqlDataReader reader) => new()
    {
        CapexId = reader.GetInt32(reader.GetOrdinal("CapexId")),
        NomCapex = reader.GetString(reader.GetOrdinal("NomCapex")),
        BudgetTotal = reader.GetDecimal(reader.GetOrdinal("BudgetTotal")),
        ResteBudget = reader.GetDecimal(reader.GetOrdinal("ResteBudget"))
    };
    
    public async Task<List<ConsommationDepartementDto>> GetConsommationParDepartementAsync(int capexId)
{
    var result = new List<ConsommationDepartementDto>();

    using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    using var command = new SqlCommand(@"
        SELECT dep.Nom AS DepartementNom, SUM(dd.Quantite * dd.Prix) AS MontantConsomme
        FROM Demande d
        INNER JOIN Utilisateur u ON d.UtilisateurId = u.Id
        INNER JOIN Departement dep ON u.DepartementID = dep.Id
        INNER JOIN DetailDemande dd ON dd.DemandeId = d.idDemande
        WHERE d.CapexId = @CapexId AND d.Statut = @Statut
        GROUP BY dep.Nom
        ORDER BY MontantConsomme DESC", connection);

    command.Parameters.AddWithValue("@CapexId", capexId);
    command.Parameters.AddWithValue("@Statut", StatutDemande.Acceptee.ToString());
    
    using var reader = await command.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        result.Add(new ConsommationDepartementDto
        {
            DepartementNom = reader.GetString(reader.GetOrdinal("DepartementNom")),
            MontantConsomme = reader.GetDecimal(reader.GetOrdinal("MontantConsomme"))
        });
    }

    return result;
}
}