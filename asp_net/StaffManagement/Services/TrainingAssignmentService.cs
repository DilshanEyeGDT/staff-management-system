using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Services
{
    public class TrainingAssignmentService
    {
        private readonly AppDbContext _db;

        public TrainingAssignmentService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<TrainingAssignmentDto> AssignCourseAsync(AssignTrainingDto dto)
        {
            // Check for duplicate assignment
            var exists = await _db.TrainingAssignments
                .AnyAsync(t => t.CourseId == dto.CourseId && t.UserId == dto.UserId);

            if (exists)
                throw new InvalidOperationException("Course is already assigned to that user.");

            var assignment = new TrainingAssignment
            {
                CourseId = dto.CourseId,
                UserId = dto.UserId,
                DueDate = dto.DueDate.HasValue
              ? DateTime.SpecifyKind(dto.DueDate.Value, DateTimeKind.Utc)
              : null,
                AssignedOn = DateTime.UtcNow,
                Progress = 0,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.TrainingAssignments.Add(assignment);
            await _db.SaveChangesAsync();

            // Load navigation properties
            await _db.Entry(assignment).Reference(a => a.User).LoadAsync();
            await _db.Entry(assignment).Reference(a => a.Course).LoadAsync();

            return new TrainingAssignmentDto
            {
                TrainingAssignmentId = assignment.TrainingAssignmentId,
                CourseId = assignment.CourseId,
                UserId = assignment.UserId,
                AssignedOn = assignment.AssignedOn,
                DueDate = assignment.DueDate,
                Progress = assignment.Progress,
                Status = assignment.Status,
                CreatedAt = assignment.CreatedAt,
                UpdatedAt = assignment.UpdatedAt,
                UserDisplayName = assignment.User.DisplayName,
                CourseTitle = assignment.Course.Title
            };
        }

        public async Task<TrainingAssignmentDto> UpdateAssignmentAsync(int assignmentId, UpdateTrainingAssignmentDto dto)
        {
            var assignment = await _db.TrainingAssignments
                .Include(a => a.User)
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.TrainingAssignmentId == assignmentId);

            if (assignment == null)
                throw new KeyNotFoundException("Training assignment not found.");

            // Update fields if they are provided
            if (dto.Progress.HasValue)
                assignment.Progress = dto.Progress.Value;

            if (!string.IsNullOrEmpty(dto.Status))
                assignment.Status = dto.Status;

            if (dto.DueDate.HasValue)
                assignment.DueDate = DateTime.SpecifyKind(dto.DueDate.Value, DateTimeKind.Utc);

            assignment.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new TrainingAssignmentDto
            {
                TrainingAssignmentId = assignment.TrainingAssignmentId,
                CourseId = assignment.CourseId,
                UserId = assignment.UserId,
                AssignedOn = assignment.AssignedOn,
                DueDate = assignment.DueDate,
                Progress = assignment.Progress,
                Status = assignment.Status,
                CreatedAt = assignment.CreatedAt,
                UpdatedAt = assignment.UpdatedAt,
                UserDisplayName = assignment.User.DisplayName,
                CourseTitle = assignment.Course.Title
            };
        }

    }
}
