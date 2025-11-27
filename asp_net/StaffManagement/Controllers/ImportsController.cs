using Microsoft.AspNetCore.Mvc;
using StaffManagement.Dtos;

[ApiController]
[Route("api/v1/imports")]
public class ImportsController : ControllerBase
{
    private readonly ImportService _importService;

    public ImportsController(ImportService importService)
    {
        _importService = importService;
    }

    [HttpPost("schedules")]
    public async Task<IActionResult> ImportSchedules([FromForm] IFormFile file)
    {
        try
        {
            // TODO: Replace hardcoded `1` with actual authenticated user ID
            int? userId = 1;

            var jobId = await _importService.CreateScheduleImportJobAsync(file, userId);

            return Ok(new ImportJobResponseDto
            {
                JobId = jobId,
                Status = "Pending"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
