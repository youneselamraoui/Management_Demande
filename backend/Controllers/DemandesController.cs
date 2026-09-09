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
            return CreatedAtAction(nameof(GetById), new { id = demande.Id }, demande);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpPut("{id}/valider")]
    public async Task<IActionResult> Valider(int id)
    {
        try
        {
            var demande = await _service.ValiderDemandeAsync(id);
            return Ok(demande);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/refuser")]
    public async Task<IActionResult> Refuser(int id)
    {
        try
        {
            var demande = await _service.RefuserDemandeAsync(id);
            return Ok(demande);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
