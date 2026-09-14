using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CapexController : ControllerBase
{
    private readonly ICapexService _service;
    public CapexController(ICapexService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllCapexAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var capex = await _service.GetCapexAsync(id);
        return capex is null ? NotFound() : Ok(capex);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCapexDto dto)
    {
        var capex = await _service.CreateCapexAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = capex.Id }, capex);
    }

    [HttpGet("{id}/consommation-departements")]
public async Task<IActionResult> GetConsommation(int id, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
{
    var result = await _service.GetConsommationAsync(id, from, to);
    return result is null ? NotFound() : Ok(result);
}
}