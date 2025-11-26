using Microsoft.AspNetCore.Mvc;
using StaffManagement.Dtos;
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
        public async Task<IActionResult> GetTasks(          //get task
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

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)   //create a task
        {
            if (dto == null)
                return BadRequest(new { status = "error", message = "Request body cannot be empty" });

            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { status = "error", message = "Title is required" });

            var task = await _taskService.CreateTaskAsync(dto);
            return CreatedAtAction(nameof(GetTasks), new { task_id = task.TaskId }, task);
        }
    }
}
