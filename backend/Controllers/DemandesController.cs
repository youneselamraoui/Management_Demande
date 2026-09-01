using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DemandesController : ControllerBase
{
    private readonly IDemandeService _service;
    public DemandesController(IDemandeService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllDemandesAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var demande = await _service.GetDemandeAsync(id);
        return demande is null ? NotFound() : Ok(demande);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDemandeDto dto)
    {
        try
        {
            var demande = await _service.CreateDemandeAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = demande.IdDemande }, demande);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}