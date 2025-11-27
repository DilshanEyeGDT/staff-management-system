using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;

public class ImportService
{
    private readonly AppDbContext _db;

    public ImportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> CreateScheduleImportJobAsync(IFormFile file, int? userId)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("File is empty.");

        // Generate unique Job ID
        var jobId = Guid.NewGuid();

        var job = new ImportJob
        {
            JobId = jobId,
            UserId = userId,
            FileName = file.FileName,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Result = null
        };

        _db.ImportJobs.Add(job);
        await _db.SaveChangesAsync();

        return jobId;
    }
}
