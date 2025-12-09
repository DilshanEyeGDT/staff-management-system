using Microsoft.AspNetCore.Mvc;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/perf")]
    public class PerformanceController : ControllerBase
    {
        private readonly IPerformanceService _perfService;

        public PerformanceController(IPerformanceService perfService)
        {
            _perfService = perfService;
        }

        // GET /api/v1/perf/kpis
        [HttpGet("kpis")]
        public async Task<IActionResult> GetKpis()
        {
            var kpis = await _perfService.GetAllKpisAsync();
            return Ok(kpis);
        }
    }
}
