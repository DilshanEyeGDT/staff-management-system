using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Services
{
    public class ScheduleService
    {
        private readonly AppDbContext _db;

        public ScheduleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<(List<ScheduleDto> schedules, int totalCount)> GetSchedulesAsync( //get schedule 
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

        public async Task<ScheduleDto> CreateScheduleAsync(CreateScheduleDto dto)   // create schedule
        {
            var schedule = new Schedule
            {
                ScheduleId = Guid.NewGuid(),
                CreatedByUserId = dto.CreatedByUserId,
                AssigneeUserId = dto.AssigneeUserId ?? dto.CreatedByUserId,
                TeamId = dto.TeamId,
                Title = dto.Title,
                Description = dto.Description,
                StartAt = dto.StartAt,
                EndAt = dto.EndAt,
                RecurrenceRule = dto.RecurrenceRule,
                Metadata = dto.Metadata,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Schedules.Add(schedule);
            await _db.SaveChangesAsync();

            // Return DTO
            return new ScheduleDto
            {
                ScheduleId = schedule.ScheduleId,
                CreatedByUserId = schedule.CreatedByUserId,
                AssigneeUserId = schedule.AssigneeUserId,
                TeamId = schedule.TeamId,
                Title = schedule.Title,
                Description = schedule.Description,
                StartAt = schedule.StartAt,
                EndAt = schedule.EndAt,
                RecurrenceRule = schedule.RecurrenceRule,
                Metadata = schedule.Metadata,
                CreatedAt = schedule.CreatedAt,
                UpdatedAt = schedule.UpdatedAt,
                DeletedAt = schedule.DeletedAt
            };
        }

        public async Task<(bool Success, string Message)> UpdateScheduleAsync(Guid scheduleId, ScheduleUpdateDto dto)   //update schedule
        {
            var schedule = await _db.Schedules.FirstOrDefaultAsync(s => s.ScheduleId == scheduleId);

            if (schedule == null)
                return (false, "Schedule not found");

            // Apply partial updates
            if (dto.AssigneeUserId.HasValue)
                schedule.AssigneeUserId = dto.AssigneeUserId.Value;

            if (!string.IsNullOrEmpty(dto.Title))
                schedule.Title = dto.Title;

            if (dto.Description != null)
                schedule.Description = dto.Description;

            if (dto.StartAt.HasValue)
                schedule.StartAt = dto.StartAt.Value;

            if (dto.EndAt.HasValue)
                schedule.EndAt = dto.EndAt.Value;

            if (dto.RecurrenceRule != null)
                schedule.RecurrenceRule = dto.RecurrenceRule;

            if (dto.Metadata != null)
                schedule.Metadata = dto.Metadata;

            schedule.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return (true, "Updated");
        }


    }
}
