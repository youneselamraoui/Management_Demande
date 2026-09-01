using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DetailDemandesController : ControllerBase
{
    private readonly IDetailDemandeService _service;
    public DetailDemandesController(IDetailDemandeService service) => _service = service;

    // GET api/detaildemandes/demande/5 — toutes les lignes d'une demande
    [HttpGet("demande/{demandeId}")]
    public async Task<IActionResult> GetByDemande(int demandeId)
        => Ok(await _service.GetByDemandeIdAsync(demandeId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var detail = await _service.GetDetailAsync(id);
        return detail is null ? NotFound() : Ok(detail);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDetailDemandeDto dto)
    {
        try
        {
            var detail = await _service.CreateDetailAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = detail.Id }, detail);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}