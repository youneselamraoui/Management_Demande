// Controllers/DepartementsController.cs
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartementsController : ControllerBase
{
    private readonly IDepartementService _service;
    public DepartementsController(IDepartementService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllDepartementsAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var departement = await _service.GetDepartementAsync(id);
        return departement is null ? NotFound() : Ok(departement);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDepartementDto dto)
    {
        var departement = await _service.CreateDepartementAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = departement.Id }, departement);
    }
}