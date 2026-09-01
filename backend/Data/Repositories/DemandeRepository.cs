using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Data.Repositories;

public class DemandeRepository : IDemandeRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    public DemandeRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    private const string BaseSelect = @"
        SELECT d.idDemande, d.UtilisateurId, u.Nom AS UtilisateurNom, d.Statut,
               d.CapexId, c.NomCapex AS CapexNom, d.RFx, d.CreateAt,
               d.DateValidateChef, d.DateValidateFinance, d.DateValidateDirecteur
        FROM Demande d
        INNER JOIN Utilisateur u ON d.UtilisateurId = u.Id
        INNER JOIN Capex c ON d.CapexId = c.CapexId";

    public async Task<Demande?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} WHERE d.idDemande = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync()) return MapToDemande(reader);
        return null;
    }

    public async Task<List<Demande>> GetAllAsync()
    {
        var demandes = new List<Demande>();

        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} ORDER BY d.CreateAt DESC", connection);
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

    private static Demande MapToDemande(SqlDataReader reader) => new()
    {
        IdDemande = reader.GetInt32(reader.GetOrdinal("idDemande")),
        UtilisateurId = reader.GetInt32(reader.GetOrdinal("UtilisateurId")),
        UtilisateurNom = reader.GetString(reader.GetOrdinal("UtilisateurNom")),
        Statut = Enum.Parse<StatutDemande>(reader.GetString(reader.GetOrdinal("Statut"))),
        CapexId = reader.GetInt32(reader.GetOrdinal("CapexId")),
        CapexNom = reader.GetString(reader.GetOrdinal("CapexNom")),
        RFx = reader.IsDBNull(reader.GetOrdinal("RFx")) ? null : reader.GetString(reader.GetOrdinal("RFx")),
        CreateAt = reader.GetDateTime(reader.GetOrdinal("CreateAt")),
        DateValidateChef = reader.IsDBNull(reader.GetOrdinal("DateValidateChef")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidateChef")),
        DateValidateFinance = reader.IsDBNull(reader.GetOrdinal("DateValidateFinance")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidateFinance")),
        DateValidateDirecteur = reader.IsDBNull(reader.GetOrdinal("DateValidateDirecteur")) ? null : reader.GetDateTime(reader.GetOrdinal("DateValidateDirecteur"))
    };
public async Task<int> AddWithDetailsAsync(Demande demande, List<DetailDemande> details)
{
    using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();
    using var transaction = connection.BeginTransaction();

    try
    {
        using var demandeCmd = new SqlCommand(@"
            INSERT INTO Demande (UtilisateurId, Statut, CapexId, RFx, CreateAt)
            VALUES (@UtilisateurId, @Statut, @CapexId, @RFx, @CreateAt);
            SELECT CAST(SCOPE_IDENTITY() AS int);", connection, transaction);

        demandeCmd.Parameters.AddWithValue("@UtilisateurId", demande.UtilisateurId);
        demandeCmd.Parameters.AddWithValue("@Statut", demande.Statut.ToString());
        demandeCmd.Parameters.AddWithValue("@CapexId", demande.CapexId);
        demandeCmd.Parameters.AddWithValue("@RFx", (object?)demande.RFx ?? DBNull.Value);
        demandeCmd.Parameters.AddWithValue("@CreateAt", DateTime.UtcNow);

        var demandeId = (int)(await demandeCmd.ExecuteScalarAsync())!;

        foreach (var detail in details)
        {
            using var detailCmd = new SqlCommand(@"
                INSERT INTO DetailDemande (DemandeId, Article, Quantite, Prix, Devis)
                VALUES (@DemandeId, @Article, @Quantite, @Prix, @Devis);", connection, transaction);

            detailCmd.Parameters.AddWithValue("@DemandeId", demandeId);
            detailCmd.Parameters.AddWithValue("@Article", detail.Article);
            detailCmd.Parameters.AddWithValue("@Quantite", detail.Quantite);
            detailCmd.Parameters.AddWithValue("@Prix", detail.Prix);
            detailCmd.Parameters.AddWithValue("@Devis", (object?)detail.Devis ?? DBNull.Value);

            await detailCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();
        return demandeId;
    }
    catch
    {
        await transaction.RollbackAsync();   // ← annule TOUT (demande + articles) en cas d'erreur
        throw;
    }
}

}