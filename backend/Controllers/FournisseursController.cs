using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FournisseursController : ControllerBase
{
    private readonly IFournisseurService _service;
    public FournisseursController(IFournisseurService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _service.GetAllFournisseursAsync();
        return Ok(list);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var stats = await _service.GetStatsAsync(from, to);
        return Ok(stats);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetStatsById(int id, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var stat = await _service.GetStatsByIdAsync(id, from, to);
        return stat is null ? NotFound() : Ok(stat);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFournisseurDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetStatsById), new { id = created.FournisseurId }, created);
        }
        catch (backend.Services.BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
