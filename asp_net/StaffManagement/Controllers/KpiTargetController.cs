using Microsoft.AspNetCore.Mvc;
using StaffManagement.Dtos;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/perf/targets")]
    public class KpiTargetController : ControllerBase
    {
        private readonly KpiTargetService _service;

        public KpiTargetController(KpiTargetService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<KpiTargetDto>> CreateOrUpdate([FromBody] CreateOrUpdateKpiTargetDto dto)
        {
            try
            {
                var result = await _service.CreateOrUpdateTargetAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
