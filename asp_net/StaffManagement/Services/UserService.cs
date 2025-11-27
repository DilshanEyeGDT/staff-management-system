using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;

public class UserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<object>> GetAllUsersAsync()
    {
        return await _db.Users
            .AsNoTracking()
            .Select(u => new
            {
                id = u.Id,
                displayName = u.DisplayName
            })
            .ToListAsync<object>();
    }
}
