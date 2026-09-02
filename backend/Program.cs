using backend.Data;
using backend.Data.Repositories;
using backend.DTOs;
using backend.Services;
using backend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ─── Base de données (ADO.NET pur, sans ORM) ───
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();

// ─── Departement ───
builder.Services.AddScoped<IDepartementRepository, DepartementRepository>();
builder.Services.AddScoped<IDepartementService, DepartementService>();

// ─── Utilisateur ───
builder.Services.AddScoped<IUtilisateurRepository, UtilisateurRepository>();
builder.Services.AddScoped<IUtilisateurService, UtilisateurService>();

builder.Services.AddScoped<ICapexRepository, CapexRepository>();
builder.Services.AddScoped<ICapexService, CapexService>();

builder.Services.AddScoped<IDemandeRepository, DemandeRepository>();
builder.Services.AddScoped<IDemandeService, DemandeService>();

builder.Services.AddScoped<IDetailDemandeRepository, DetailDemandeRepository>();
builder.Services.AddScoped<IDetailDemandeService, DetailDemandeService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReact");   // ← avant UseAuthorization

app.UseAuthorization();

app.MapControllers();

app.Run();