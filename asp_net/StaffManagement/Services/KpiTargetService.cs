using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Services
{
    public class KpiTargetService
    {
        private readonly AppDbContext _db;

        public KpiTargetService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<KpiTargetDto> CreateOrUpdateTargetAsync(CreateOrUpdateKpiTargetDto dto)
        {
            // Check if target exists for same user, KPI and period
            var target = await _db.KpiTargets
                .Include(t => t.User)
                .Include(t => t.Kpi)
                .FirstOrDefaultAsync(t =>
                    t.UserId == dto.UserId &&
                    t.KpiId == dto.KpiId &&
                    t.PeriodStart == dto.PeriodStart &&
                    t.PeriodEnd == dto.PeriodEnd
                );

            string message;

            if (target != null)
            {
                // Update existing target
                target.TargetValue = dto.TargetValue;
                target.UpdatedAt = DateTime.UtcNow;
                message = "Existing target found and updated.";
            }
            else
            {
                // Create new target
                target = new KpiTarget
                {
                    UserId = dto.UserId,
                    KpiId = dto.KpiId,
                    PeriodStart = dto.PeriodStart,
                    PeriodEnd = dto.PeriodEnd,
                    TargetValue = dto.TargetValue,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.KpiTargets.Add(target);
                message = "New target created.";
            }

            await _db.SaveChangesAsync();

            // 🔥 VERY IMPORTANT: Reload the entity WITH navigation properties if it was newly created
            target = await _db.KpiTargets
                .Include(t => t.User)
                .Include(t => t.Kpi)
                .FirstAsync(t => t.KpiTargetId == target.KpiTargetId);

            // Return mapped DTO
            return new KpiTargetDto
            {
                KpiTargetId = target.KpiTargetId,
                UserId = target.UserId,
                KpiId = target.KpiId,
                PeriodStart = target.PeriodStart,
                PeriodEnd = target.PeriodEnd,
                TargetValue = target.TargetValue,
                CreatedAt = target.CreatedAt,
                UpdatedAt = target.UpdatedAt,
                UserDisplayName = target.User.DisplayName,
                KpiName = target.Kpi.Name,
                Message = message
            };
        }
    }
}
