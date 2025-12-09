using Microsoft.AspNetCore.Mvc;
using StaffManagement.Dtos;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/training")]
    public class TrainingAssignmentController : ControllerBase
    {
        private readonly TrainingAssignmentService _service;

        public TrainingAssignmentController(TrainingAssignmentService service)
        {
            _service = service;
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignCourse([FromBody] AssignTrainingDto dto)
        {
            if (dto == null)
                return BadRequest(new { status = "error", message = "Request body cannot be empty" });

            try
            {
                var assigned = await _service.AssignCourseAsync(dto);
                return Ok(new { status = "ok", message = "Course assigned successfully", assignment = assigned });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPatch("assignments/{id}")]
        public async Task<IActionResult> UpdateAssignment(int id, [FromBody] UpdateTrainingAssignmentDto dto)
        {
            try
            {
                var updatedAssignment = await _service.UpdateAssignmentAsync(id, dto);
                return Ok(updatedAssignment);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(new { message = e.Message });
            }
            catch (Exception e)
            {
                return BadRequest(new { message = e.Message });
            }
        }

        // GET api/v1/training/user/{userId}/assignments
        [HttpGet("user/{userId}/assignments")]
        public async Task<IActionResult> GetUserAssignments(int userId)
        {
            try
            {
                var assignments = await _service.GetAssignmentsByUserAsync(userId);
                return Ok(new { status = "ok", assignments });
            }
            catch (Exception e)
            {
                return BadRequest(new { status = "error", message = e.Message });
            }
        }

    }
}
