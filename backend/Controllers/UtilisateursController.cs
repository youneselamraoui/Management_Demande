// Controllers/UtilisateursController.cs
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Services.Interfaces;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UtilisateursController : ControllerBase
{
    private readonly IUtilisateurService _service;
    public UtilisateursController(IUtilisateurService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllUtilisateursAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var utilisateur = await _service.GetUtilisateurAsync(id);
        return utilisateur is null ? NotFound() : Ok(utilisateur);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUtilisateurDto dto)
    {
        try
        {
            var utilisateur = await _service.CreateUtilisateurAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = utilisateur.Id }, utilisateur);
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}