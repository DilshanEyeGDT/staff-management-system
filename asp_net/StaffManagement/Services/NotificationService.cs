using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace StaffManagement.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _db;

        public NotificationService(AppDbContext db)
        {
            _db = db;
        }

        // Queue reminder for a single assignment
        public async Task QueueReminderAsync(TrainingAssignment assignment)
        {
            // Load navigation properties if not already loaded
            if (assignment.User == null)
                await _db.Entry(assignment).Reference(a => a.User).LoadAsync();

            if (assignment.Course == null)
                await _db.Entry(assignment).Reference(a => a.Course).LoadAsync();

            // For now, just log or simulate queuing
            Console.WriteLine($"Reminder queued for {assignment.User.DisplayName} - Course: {assignment.Course.Title}");
        }

        // Optionally: queue reminders for all assignments
        public async Task<List<TrainingAssignment>> QueueRemindersForAllAsync()
        {
            var assignments = await _db.TrainingAssignments
                .Include(a => a.User)
                .Include(a => a.Course)
                .ToListAsync();

            foreach (var assignment in assignments)
            {
                Console.WriteLine($"Reminder queued for {assignment.User.DisplayName} - Course: {assignment.Course.Title}");
            }

            return assignments;
        }
    }
}
