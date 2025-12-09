using StaffManagement.Persistence.Entities;

namespace StaffManagement.Services
{
    public interface IPerformanceService
    {
        Task<List<Kpi>> GetAllKpisAsync();
    }
}
