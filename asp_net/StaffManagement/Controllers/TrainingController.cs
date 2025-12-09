using Microsoft.AspNetCore.Mvc;
using StaffManagement.Dtos;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/training")]
    public class TrainingController : ControllerBase
    {
        private readonly TrainingCourseService _service;

        public TrainingController(TrainingCourseService service)
        {
            _service = service;
        }

        [HttpGet("courses")]
        public async Task<IActionResult> GetCourses(
            [FromQuery] string? query,
            [FromQuery] int page = 1,
            [FromQuery] int size = 10)
        {
            var (courses, totalCount) = await _service.GetCoursesAsync(query, page, size);

            return Ok(new
            {
                totalCount,
                page,
                size,
                courses
            });
        }
    }
}
