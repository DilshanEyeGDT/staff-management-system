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

        [HttpPatch("{taskId}")] // modify a task
        public async Task<IActionResult> UpdateTask(
        Guid taskId,
        [FromBody] UpdateTaskDto dto)
        {
            var updatedTask = await _taskService.UpdateTaskAsync(taskId, dto);

            if (updatedTask == null)
                return NotFound(new { message = "Task not found" });

            return Ok(updatedTask);
        }

        [HttpPost("{taskId}/comments")]     // add comment to a task
        public async Task<IActionResult> AddComment(Guid taskId, [FromBody] CreateTaskCommentDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Request body required" });
            if (string.IsNullOrWhiteSpace(dto.Content)) return BadRequest(new { message = "Content is required" });

            try
            {
                var note = await _taskService.AddCommentAsync(taskId, dto);
                return Ok(note);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // log ex if you have logging
                return StatusCode(500, new { message = "An error occurred", detail = ex.Message });
            }
        }


    }
}
