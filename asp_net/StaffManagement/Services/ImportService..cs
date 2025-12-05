using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence;
using StaffManagement.Persistence.Entities;
using System.Formats.Asn1;
using System.Globalization;
using System.Text.Json;

public class ImportService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ImportService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<Guid> CreateScheduleImportJobAsync(IFormFile file, int? userId)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("File is empty.");

        var jobId = Guid.NewGuid();
        var filePath = Path.Combine(_env.ContentRootPath, "Uploads", $"{jobId}.csv");

        Directory.CreateDirectory(Path.Combine(_env.ContentRootPath, "Uploads"));

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var job = new ImportJob
        {
            JobId = jobId,
            UserId = userId,
            FileName = file.FileName,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ImportJobs.Add(job);
        await _db.SaveChangesAsync();

        _ = Task.Run(async () =>
        {
            await ProcessScheduleImportAsync(jobId, filePath);
        });

        return jobId;
    }

    public async Task<ImportJob?> GetImportJobAsync(Guid jobId)
    {
        return await _db.ImportJobs.AsNoTracking().FirstOrDefaultAsync(j => j.JobId == jobId);
    }

    private async Task ProcessScheduleImportAsync(Guid jobId, string filePath)
    {
        var job = await _db.ImportJobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null) return;

        try
        {
            job.Status = "Processing";
            job.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null
            };

            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, config);

            var records = csv.GetRecords<dynamic>().ToList();
            job.TotalRows = records.Count;

            foreach (var record in records)
            {
                var dict = (IDictionary<string, object>)record;

                var metadata = new Dictionary<string, string>();
                foreach (var kv in dict)
                {
                    if (kv.Key.StartsWith("metadata_"))
                    {
                        metadata[kv.Key.Replace("metadata_", "")] = kv.Value?.ToString();
                    }
                }

                var schedule = new Schedule
                {
                    CreatedByUserId = int.Parse(dict["createdByUserId"].ToString()),
                    AssigneeUserId = int.Parse(dict["assigneeUserId"].ToString()),
                    TeamId = Guid.Parse(dict["teamId"].ToString()),
                    Title = dict["title"].ToString(),
                    Description = dict["description"]?.ToString(),
                    StartAt = DateTime.Parse(dict["startAt"].ToString()),
                    EndAt = DateTime.Parse(dict["endAt"].ToString()),
                    RecurrenceRule = dict["recurrenceRule"]?.ToString(),
                    Metadata = JsonSerializer.Serialize(metadata),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.Schedules.Add(schedule);
            }

            await _db.SaveChangesAsync();

            job.Status = "Completed";
            job.Result = "Imported successfully";
            job.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            job.Status = "Failed";
            job.Result = ex.Message;
            job.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }
}
