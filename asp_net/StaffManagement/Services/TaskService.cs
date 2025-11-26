using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
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

        public async Task<(List<TaskDto> tasks, int totalCount)> GetTasksAsync(
    int? assignee,
    string? status,
    int page,
    int size)
        {
            var query = _db.Tasks
                .AsNoTracking()
                .Where(t => t.DeletedAt == null);

            if (assignee.HasValue)
                query = query.Where(t => t.AssigneeUserId == assignee);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status);

            var totalCount = await query.CountAsync();

            var tasks = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(t => new TaskDto
                {
                    TaskId = t.TaskId,
                    Title = t.Title,
                    Description = t.Description,
                    Priority = t.Priority,
                    Status = t.Status,
                    DueAt = t.DueAt,
                    CreatedByUserId = t.CreatedByUserId,
                    AssigneeUserId = t.AssigneeUserId,
                    NotesCount = t.Notes.Count
                })
                .ToListAsync();

            return (tasks, totalCount);
        }


        public async Task<TaskItem> CreateTaskAsync(CreateTaskDto dto)  //create task
        {
            if (!string.IsNullOrEmpty(dto.IdempotencyKey))
            {
                // Check if a task with the same idempotency key exists
                var existingTask = await _db.Tasks
                    .FirstOrDefaultAsync(t => t.IdempotencyKey == dto.IdempotencyKey);
                if (existingTask != null)
                {
                    return existingTask;
                }
            }

            var task = new TaskItem
            {
                TaskId = Guid.NewGuid(),
                CreatedByUserId = dto.CreatedByUserId,
                AssigneeUserId = dto.AssigneeUserId,
                Title = dto.Title,
                Description = dto.Description,
                Priority = dto.Priority,
                Status = dto.Status,
                DueAt = dto.DueAt,
                Metadata = dto.Metadata,
                IdempotencyKey = dto.IdempotencyKey,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Tasks.Add(task);
            await _db.SaveChangesAsync();
            return task;
        }
    }
}
