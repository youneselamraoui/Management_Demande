// Data/Repositories/UtilisateurRepository.cs
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Data.Repositories;

public class UtilisateurRepository : IUtilisateurRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public UtilisateurRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    // Jointure pour récupérer le nom du département en même temps
    private const string BaseSelect = @"
        SELECT u.Id, u.Nom, u.DepartementID, d.Nom AS DepartementNom
        FROM Utilisateur u
        INNER JOIN Departement d ON u.DepartementID = d.Id";

    public async Task<Utilisateurs?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand($"{BaseSelect} WHERE u.Id = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapToUtilisateur(reader);

        return null;
    }

    public async Task<List<Utilisateurs>> GetAllAsync()
    {
        var utilisateurs = new List<Utilisateurs>();

        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(BaseSelect, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
            utilisateurs.Add(MapToUtilisateur(reader));

        return utilisateurs;
    }

    public async Task<int> AddAsync(Utilisateurs utilisateur)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(
            "INSERT INTO Utilisateur (Nom, DepartementID) VALUES (@Nom, @DepartementID); SELECT CAST(SCOPE_IDENTITY() AS int);",
            connection);
        command.Parameters.AddWithValue("@Nom", utilisateur.Nom);
        command.Parameters.AddWithValue("@DepartementID", utilisateur.DepartementID);

        return (int)(await command.ExecuteScalarAsync())!;
    }

    private static Utilisateurs MapToUtilisateur(SqlDataReader reader) => new()
    {
        Id = reader.GetInt32(reader.GetOrdinal("Id")),
        Nom = reader.GetString(reader.GetOrdinal("Nom")),
        DepartementID = reader.GetInt32(reader.GetOrdinal("DepartementID")),
        DepartementNom = reader.GetString(reader.GetOrdinal("DepartementNom"))
    };
}