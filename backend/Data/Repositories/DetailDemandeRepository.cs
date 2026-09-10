using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Data.Repositories;

public class DetailDemandeRepository : IDetailDemandeRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public DetailDemandeRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string BaseSelect =
        "SELECT Id, DemandeId, Article, Quantite, Prix, Devis FROM DetailDemande";

    public async Task<DetailDemande?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} WHERE Id = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapToDetailDemande(reader);

        return null;
    }

    // Récupère toutes les lignes d'articles d'une demande donnée
    public async Task<List<DetailDemande>> GetByDemandeIdAsync(int demandeId)
    {
        var details = new List<DetailDemande>();

        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} WHERE DemandeId = @DemandeId", connection);
        command.Parameters.AddWithValue("@DemandeId", demandeId);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            details.Add(MapToDetailDemande(reader));

        return details;
    }

    public async Task<int> AddAsync(DetailDemande detail)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(@"
            INSERT INTO DetailDemande (DemandeId, Article, Quantite, Prix, Devis)
            VALUES (@DemandeId, @Article, @Quantite, @Prix, @Devis);
            SELECT CAST(SCOPE_IDENTITY() AS int);", connection);

        command.Parameters.AddWithValue("@DemandeId", detail.DemandeId);
        command.Parameters.AddWithValue("@Article", detail.Article);
        command.Parameters.AddWithValue("@Quantite", detail.Quantite);
        command.Parameters.AddWithValue("@Prix", (object?)detail.Prix ?? DBNull.Value);
        command.Parameters.AddWithValue("@Devis", (object?)detail.Devis ?? DBNull.Value);

        return (int)(await command.ExecuteScalarAsync())!;
    }

    public async Task<bool> UpdateAsync(DetailDemande detail)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(@"
            UPDATE DetailDemande
            SET Article = @Article, Quantite = @Quantite, Prix = @Prix, Devis = @Devis
            WHERE Id = @Id", connection);

        command.Parameters.AddWithValue("@Id", detail.Id);
        command.Parameters.AddWithValue("@Article", detail.Article);
        command.Parameters.AddWithValue("@Quantite", detail.Quantite);
        command.Parameters.AddWithValue("@Prix", (object?)detail.Prix ?? DBNull.Value);
        command.Parameters.AddWithValue("@Devis", (object?)detail.Devis ?? DBNull.Value);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand("DELETE FROM DetailDemande WHERE Id = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    private static DetailDemande MapToDetailDemande(SqlDataReader reader) => new()
    {
        Id = reader.GetInt32(reader.GetOrdinal("Id")),
        DemandeId = reader.GetInt32(reader.GetOrdinal("DemandeId")),
        Article = reader.GetString(reader.GetOrdinal("Article")),
        Quantite = reader.GetInt32(reader.GetOrdinal("Quantite")),
        Prix = reader.IsDBNull(reader.GetOrdinal("Prix")) ? null : reader.GetDouble(reader.GetOrdinal("Prix")),
        Devis = reader.IsDBNull(reader.GetOrdinal("Devis")) ? null : reader.GetString(reader.GetOrdinal("Devis"))
    };
}