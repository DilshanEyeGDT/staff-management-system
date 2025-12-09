using Microsoft.AspNetCore.Mvc;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/perf/metrics")]
    public class KpiMetricsController : ControllerBase
    {
        private readonly KpiMetricsService _service;

        public KpiMetricsController(KpiMetricsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetMetrics(
            [FromQuery] int user_id,
            [FromQuery] string range,      // e.g. "2025-01-01:2025-01-31"
            [FromQuery] int? kpi = null)
        {
            if (string.IsNullOrEmpty(range) || !range.Contains(':'))
                return BadRequest("Invalid range. Use format YYYY-MM-DD:YYYY-MM-DD");

            var parts = range.Split(':');
            if (!DateTime.TryParse(parts[0], out var startDate) || !DateTime.TryParse(parts[1], out var endDate))
                return BadRequest("Invalid dates in range.");

            var result = await _service.GetMetricsSnapshotAsync(user_id, startDate, endDate, kpi);
            return Ok(result);
        }
    }
}
