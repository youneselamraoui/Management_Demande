// Data/DbConnectionFactory.cs
using Microsoft.Data.SqlClient;

namespace backend.Data;

public interface IDbConnectionFactory
{
    SqlConnection CreateConnection();
}

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration config)
        => _connectionString = config.GetConnectionString("DefaultConnection")!;

    public SqlConnection CreateConnection() => new(_connectionString);
}