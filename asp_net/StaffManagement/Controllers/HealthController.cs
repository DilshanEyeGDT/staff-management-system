using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;
    public HealthController(AppDbContext db) => _db = db;

    [HttpGet("db")]
    public async Task<IActionResult> CheckDb()
    {
        try
        {
            // Simple connection test
            await _db.Database.ExecuteSqlRawAsync("SELECT 1");
            return Ok(new { status = "ok", message = "Database connection successful" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { status = "error", message = ex.Message });
        }
    }
}
