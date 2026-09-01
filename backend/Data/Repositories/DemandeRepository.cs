using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Data.Repositories;

public class DemandeRepository : IDemandeRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    public DemandeRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string BaseSelect = @"
        SELECT idDemande, UtilisateurId, Statut, CapexId, RFx, CreateAt,
               DateValidation1, DateValidation2,
               DateValidateChef, DateValidateFinance, DateValidateDirecteur
        FROM Demande";

    public async Task<Demande?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} WHERE idDemande = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapToDemande(reader);

        return null;
    }

    public async Task<List<Demande>> GetAllAsync()
    {
        var demandes = new List<Demande>();

        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(BaseSelect, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
            demandes.Add(MapToDemande(reader));

        return demandes;
    }

    public async Task<int> AddAsync(Demande demande)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(@"
            INSERT INTO Demande (UtilisateurId, Statut, CapexId, RFx, CreateAt)
            VALUES (@UtilisateurId, @Statut, @CapexId, @RFx, @CreateAt);
            SELECT CAST(SCOPE_IDENTITY() AS int);", connection);

        command.Parameters.AddWithValue("@UtilisateurId", demande.UtilisateurId);
        command.Parameters.AddWithValue("@Statut", demande.Statut.ToString());
        command.Parameters.AddWithValue("@CapexId", demande.CapexId);
        command.Parameters.AddWithValue("@RFx", (object?)demande.RFx ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreateAt", DateTime.UtcNow);

        return (int)(await command.ExecuteScalarAsync())!;
    }

    public async Task UpdateAsync(Demande demande)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(@"
            UPDATE Demande
            SET Statut = @Statut,
                DateValidation1 = @DateValidation1,
                DateValidation2 = @DateValidation2,
                DateValidateChef = @DateValidateChef,
                DateValidateFinance = @DateValidateFinance,
                DateValidateDirecteur = @DateValidateDirecteur
            WHERE idDemande = @Id", connection);

        command.Parameters.AddWithValue("@Id", demande.IdDemande);
        command.Parameters.AddWithValue("@Statut", demande.Statut.ToString());
        command.Parameters.AddWithValue("@DateValidation1", (object?)demande.DateValidation1 ?? DBNull.Value);
        command.Parameters.AddWithValue("@DateValidation2", (object?)demande.DateValidation2 ?? DBNull.Value);
        command.Parameters.AddWithValue("@DateValidateChef", (object?)demande.DateValidateChef ?? DBNull.Value);
        command.Parameters.AddWithValue("@DateValidateFinance", (object?)demande.DateValidateFinance ?? DBNull.Value);
        command.Parameters.AddWithValue("@DateValidateDirecteur", (object?)demande.DateValidateDirecteur ?? DBNull.Value);

        await command.ExecuteNonQueryAsync();
    }

    private static Demande MapToDemande(SqlDataReader reader) => new()
    {
        IdDemande = reader.GetInt32(reader.GetOrdinal("idDemande")),
        UtilisateurId = reader.GetInt32(reader.GetOrdinal("UtilisateurId")),
        Statut = Enum.Parse<StatutDemande>(reader.GetString(reader.GetOrdinal("Statut"))),
        CapexId = reader.GetInt32(reader.GetOrdinal("CapexId")),
        RFx = reader.IsDBNull(reader.GetOrdinal("RFx")) ? null : reader.GetString(reader.GetOrdinal("RFx")),
        CreateAt = reader.GetDateTime(reader.GetOrdinal("CreateAt")),
        DateValidation1 = reader.IsDBNull(reader.GetOrdinal("DateValidation1")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidation1")),
        DateValidation2 = reader.IsDBNull(reader.GetOrdinal("DateValidation2")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidation2")),
        DateValidateChef = reader.IsDBNull(reader.GetOrdinal("DateValidateChef")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidateChef")),
        DateValidateFinance = reader.IsDBNull(reader.GetOrdinal("DateValidateFinance")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidateFinance")),
        DateValidateDirecteur = reader.IsDBNull(reader.GetOrdinal("DateValidateDirecteur")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidateDirecteur"))
    };
}