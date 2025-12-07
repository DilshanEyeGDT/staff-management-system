using Microsoft.AspNetCore.Mvc;
using StaffManagement.Services;
using StaffManagement.Dtos;

namespace StaffManagement.Controllers.Performance
{
    [ApiController]
    [Route("api/v1/perf/actuals")]
    public class PerfActualsImportController : ControllerBase
    {
        private readonly ImportService _importService;

        public PerfActualsImportController(ImportService importService)
        {
            _importService = importService;
        }

        // POST: /api/v1/perf/actuals/import
        [HttpPost("import")]
        public async Task<IActionResult> ImportKpiActuals([FromForm] IFormFile file)
        {
            try
            {
                // TODO: Replace with actual authenticated user ID
                int? userId = 1;

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "CSV file is required." });
                }

                Guid jobId = await _importService.CreateKpiActualImportJobAsync(file, userId);

                return Ok(new
                {
                    jobId,
                    status = "queued"
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
}
