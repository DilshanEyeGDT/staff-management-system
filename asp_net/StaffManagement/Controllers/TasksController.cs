using Microsoft.AspNetCore.Mvc;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly TaskService _taskService;

        public TasksController(TaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks(
            [FromQuery] int? assignee,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            var (tasks, totalCount) = await _taskService.GetTasksAsync(assignee, status, page, size);

            return Ok(new
            {
                totalCount,
                page,
                size,
                tasks
            });
        }
    }
}
