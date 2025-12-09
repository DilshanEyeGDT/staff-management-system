using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;
using StaffManagement.Services;

namespace StaffManagement.Services
{
    public class PerformanceService : IPerformanceService
    {
        private readonly AppDbContext _db;

        public PerformanceService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Kpi>> GetAllKpisAsync()
        {
            return await _db.Kpis
                .OrderBy(k => k.KpiId)
                .ToListAsync();
        }
    }
}
