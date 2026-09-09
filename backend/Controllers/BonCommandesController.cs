using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BonCommandesController : ControllerBase
{
    private readonly IBonCommandeService _service;
    public BonCommandesController(IBonCommandeService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var bc = await _service.GetByIdAsync(id);
        return bc is null ? NotFound() : Ok(bc);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBonCommandeDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (backend.Services.BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
