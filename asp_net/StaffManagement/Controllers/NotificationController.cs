using Microsoft.AspNetCore.Mvc;
using StaffManagement.Services;

namespace StaffManagement.Controllers
{
    [ApiController]
    [Route("api/v1/notify")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;

        public NotificationController(NotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // POST /api/v1/notify/staff
        [HttpPost("staff")]
        public async Task<IActionResult> NotifyStaff()
        {
            var assignments = await _notificationService.QueueRemindersForAllAsync();
            return Ok(assignments.Select(a => new
            {
                a.TrainingAssignmentId,
                a.UserId,
                UserName = a.User.DisplayName,
                a.CourseId,
                CourseTitle = a.Course.Title,
                a.Status,
                a.Progress,
                a.DueDate
            }));
        }
    }
}
