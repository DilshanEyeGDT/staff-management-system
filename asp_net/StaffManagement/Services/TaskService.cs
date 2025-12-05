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

        public async Task<TaskDto?> UpdateTaskAsync(Guid taskId, UpdateTaskDto dto)
        {
            var task = await _db.Tasks
                .Include(t => t.Notes)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.DeletedAt == null);

            if (task == null) return null;

            // Only update fields that are provided
            if (!string.IsNullOrWhiteSpace(dto.Status))
                task.Status = dto.Status;

            if (!string.IsNullOrWhiteSpace(dto.Title))
                task.Title = dto.Title;

            if (!string.IsNullOrWhiteSpace(dto.Description))
                task.Description = dto.Description;

            if (dto.Priority.HasValue)
                task.Priority = dto.Priority.Value;

            if (dto.DueAt.HasValue)
                task.DueAt = dto.DueAt;

            if (dto.AssigneeUserId.HasValue)
                task.AssigneeUserId = dto.AssigneeUserId;

            task.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Return minimal DTO
            return new TaskDto
            {
                TaskId = task.TaskId,
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                Status = task.Status,
                DueAt = task.DueAt,
                CreatedByUserId = task.CreatedByUserId,
                AssigneeUserId = task.AssigneeUserId,
                NotesCount = task.Notes.Count
            };
        }

        public async Task<TaskNoteResponseDto> AddCommentAsync(Guid taskId, CreateTaskCommentDto dto)
        {
            var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId && t.DeletedAt == null);
            if (task == null)
                throw new InvalidOperationException("Task not found");

            var userExists = await _db.Users.AnyAsync(u => u.Id == dto.CreatedByUserId);
            if (!userExists)
                throw new InvalidOperationException($"User {dto.CreatedByUserId} not found");

            var note = new TaskNote
            {
                TaskNoteId = Guid.NewGuid(),
                TaskId = taskId,
                AuthorUserId = dto.CreatedByUserId,
                Body = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _db.TaskNotes.Add(note);
            await _db.SaveChangesAsync();

            // Return DTO (no cycles)
            return new TaskNoteResponseDto
            {
                TaskNoteId = note.TaskNoteId,
                TaskId = note.TaskId,
                AuthorUserId = note.AuthorUserId,
                Body = note.Body,
                CreatedAt = note.CreatedAt
            };
        }

    }
}
