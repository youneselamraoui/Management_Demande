using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services.Interfaces;
using System.Text.RegularExpressions;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BonCommandesController : ControllerBase
{
    private readonly IBonCommandeService _service;
    private readonly IWebHostEnvironment _environment;
    public BonCommandesController(IBonCommandeService service, IWebHostEnvironment environment)
    {
        _service = service;
        _environment = environment;
    }

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

    [HttpPut("{id}/chemin-finance")]
    public async Task<IActionResult> UpdateCheminFinance(int id, [FromBody] UpdateCheminFinanceDto dto)
    {
        try
        {
            return Ok(await _service.UpdateCheminFinanceAsync(id, dto.CheminFinance));
        }
        catch (backend.Services.BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/chemin-finance/upload")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> UploadCheminFinance(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Veuillez sélectionner un fichier PDF." });

        if (!Path.GetExtension(file.FileName).Equals(".pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Seuls les fichiers PDF sont acceptés." });

        try
        {
            var bonCommande = await _service.GetByIdAsync(id);
            if (bonCommande is null) return NotFound();

            var uploadsDir = Path.Combine(_environment.WebRootPath, "uploads", "factures");
            Directory.CreateDirectory(uploadsDir);

            var po = string.IsNullOrWhiteSpace(bonCommande.Po) ? $"PO_{bonCommande.Id}" : bonCommande.Po;
            var baseName = $"demande_{bonCommande.DemandeId}_{Slug(po)}";
            var fileName = NextFileName(uploadsDir, baseName);
            var fullPath = Path.Combine(uploadsDir, fileName);

            await using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            var webPath = $"/uploads/factures/{fileName}";
            return Ok(await _service.UpdateCheminFinanceAsync(id, webPath));
        }
        catch (backend.Services.BusinessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private static string Slug(string value)
    {
        var slug = Regex.Replace(value.Trim(), @"[^A-Za-z0-9]+", "_").Trim('_');
        return string.IsNullOrWhiteSpace(slug) ? "PO" : slug;
    }

    private static string NextFileName(string directory, string baseName)
    {
        var index = 1;
        string fileName;
        do
        {
            fileName = $"{baseName}-{index}.pdf";
            index++;
        } while (System.IO.File.Exists(Path.Combine(directory, fileName)));
        return fileName;
    }
}
