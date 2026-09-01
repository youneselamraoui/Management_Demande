// Controllers/DemandesController.cs
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

    [HttpPost("{id}/valider-chef")]
    public async Task<IActionResult> ValiderChef(int id)
    {
        try { await _service.ValiderParChefAsync(id); return NoContent(); }
        catch (BusinessException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{id}/valider-finance")]
    public async Task<IActionResult> ValiderFinance(int id)
    {
        try { await _service.ValiderParFinanceAsync(id); return NoContent(); }
        catch (BusinessException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{id}/valider-directeur")]
    public async Task<IActionResult> ValiderDirecteur(int id)
    {
        try { await _service.ValiderParDirecteurAsync(id); return NoContent(); }
        catch (BusinessException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{id}/rejeter")]
    public async Task<IActionResult> Rejeter(int id)
    {
        try { await _service.RejeterAsync(id); return NoContent(); }
        catch (BusinessException ex) { return BadRequest(new { message = ex.Message }); }
    }
}