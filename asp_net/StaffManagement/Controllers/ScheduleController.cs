using Microsoft.AspNetCore.Mvc;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class SchedulesController : ControllerBase
    {
        private readonly ScheduleService _scheduleService;

        public SchedulesController(ScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSchedules(
            [FromQuery] int? user_id,
            [FromQuery] Guid? team_id,
            [FromQuery] DateTimeOffset? start,
            [FromQuery] DateTimeOffset? end,
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            var (schedules, totalCount) = await _scheduleService.GetSchedulesAsync(
                user_id, team_id, start, end, page, size
            );

            return Ok(new
            {
                totalCount,
                page,
                size,
                schedules
            });
        }
    }
}
