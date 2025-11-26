using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
using StaffManagement.Persistence;

namespace StaffManagement.Services
{
    public class ScheduleService
    {
        private readonly AppDbContext _db;

        public ScheduleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(List<ScheduleDto> schedules, int totalCount)> GetSchedulesAsync(
            int? userId = null,
            Guid? teamId = null,
            DateTimeOffset? start = null,
            DateTimeOffset? end = null,
            int page = 1,
            int size = 10)
        {
            var query = _db.Schedules.AsQueryable();

            // Filters
            if (userId.HasValue)
                query = query.Where(s => s.AssigneeUserId == userId.Value);

            if (teamId.HasValue)
                query = query.Where(s => s.TeamId == teamId.Value);

            if (start.HasValue)
                query = query.Where(s => s.StartAt >= start.Value);

            if (end.HasValue)
                query = query.Where(s => s.EndAt <= end.Value);

            // Total count
            var totalCount = await query.CountAsync();

            // Pagination
            var schedules = await query
                .OrderBy(s => s.StartAt)
                .Skip((page - 1) * size)
                .Take(size)
                .Select(s => new ScheduleDto
                {
                    ScheduleId = s.ScheduleId,
                    CreatedByUserId = s.CreatedByUserId,
                    AssigneeUserId = s.AssigneeUserId,
                    TeamId = s.TeamId,
                    Title = s.Title,
                    Description = s.Description,
                    StartAt = s.StartAt,
                    EndAt = s.EndAt,
                    RecurrenceRule = s.RecurrenceRule,
                    Metadata = s.Metadata,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                    DeletedAt = s.DeletedAt
                })
                .ToListAsync();

            return (schedules, totalCount);
        }
    }
}
