using Microsoft.EntityFrameworkCore;
using StaffManagement.Dtos;
using StaffManagement.Persistence;

namespace StaffManagement.Services
{
    public class KpiMetricsService
    {
        private readonly AppDbContext _db;

        public KpiMetricsService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<KpiMetricSnapshotDto>> GetMetricsSnapshotAsync(
            int userId, DateTime startDate, DateTime endDate, int? kpiId = null)
        {
            // Get KPI targets for the user within the date range
            var targetsQuery = _db.KpiTargets
                .Include(t => t.Kpi)
                .Where(t => t.UserId == userId
                            && t.PeriodEnd >= startDate
                            && t.PeriodStart <= endDate);

            if (kpiId.HasValue)
                targetsQuery = targetsQuery.Where(t => t.KpiId == kpiId.Value);

            var targets = await targetsQuery.ToListAsync();
            var snapshots = new List<KpiMetricSnapshotDto>();

            foreach (var target in targets)
            {
                // Sum actuals in the target period
                var startUtc = DateTime.SpecifyKind(target.PeriodStart, DateTimeKind.Utc);
                var endUtc = DateTime.SpecifyKind(target.PeriodEnd, DateTimeKind.Utc);

                var actualValue = await _db.KpiActuals
                    .Where(a => a.UserId == target.UserId
                                && a.KpiId == target.KpiId
                                && a.PeriodDate >= startUtc
                                && a.PeriodDate <= endUtc)
                    .SumAsync(a => (decimal?)a.ActualValue) ?? 0;


                var difference = actualValue - target.TargetValue;
                var progress = target.TargetValue != 0 ? actualValue / target.TargetValue * 100 : (decimal?)null;

                snapshots.Add(new KpiMetricSnapshotDto
                {
                    KpiId = target.KpiId,
                    KpiName = target.Kpi.Name,
                    TargetValue = target.TargetValue,
                    ActualValue = actualValue,
                    Difference = difference,
                    Progress = progress,
                    PeriodStart = target.PeriodStart,
                    PeriodEnd = target.PeriodEnd
                });
            }

            return snapshots;
        }
    }
}
