using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Services
{
    public class TaskService
    {
        private readonly AppDbContext _db;

        public TaskService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(List<TaskItem> tasks, int totalCount)> GetTasksAsync(
            int? assignee,
            string? status,
            int page,
            int size)
        {
            var query = _db.Tasks
                .AsNoTracking()
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssigneeUser)
                .Include(t => t.Notes)
                .Where(t => t.DeletedAt == null)   // Exclude soft-deleted tasks
                .AsQueryable();

            if (assignee.HasValue)
                query = query.Where(t => t.AssigneeUserId == assignee);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status);

            var totalCount = await query.CountAsync();

            var tasks = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * size)
                .Take(size)
                .ToListAsync();

            return (tasks, totalCount);
        }
    }
}
