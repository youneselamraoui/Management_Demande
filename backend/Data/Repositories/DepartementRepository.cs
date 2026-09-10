using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Data.Repositories;

public class DepartementRepository : IDepartementRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public DepartementRepository(IDbConnectionFactory connectionFactory)
        => _connectionFactory = connectionFactory;

    public async Task<Departements?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(
            "SELECT Id, Nom FROM Departement WHERE Id = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return MapToDepartement(reader);

        return null;
    }

    public async Task<List<Departements>> GetAllAsync()
    {
        var departements = new List<Departements>();

        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand("SELECT Id, Nom FROM Departement", connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
            departements.Add(MapToDepartement(reader));

        return departements;
    }

    public async Task<int> AddAsync(Departements departement)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var command = new SqlCommand(
            "INSERT INTO Departement (Nom) VALUES (@Nom); SELECT CAST(SCOPE_IDENTITY() AS int);",
            connection);
        command.Parameters.AddWithValue("@Nom", departement.Nom);

        return (int)(await command.ExecuteScalarAsync())!;
    }

    private static Departements MapToDepartement(SqlDataReader reader) => new()
    {
        Id = reader.GetInt32(reader.GetOrdinal("Id")),
        Nom = reader.GetString(reader.GetOrdinal("Nom"))
    };
}