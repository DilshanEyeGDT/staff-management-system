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
    private readonly IServiceScopeFactory _scopeFactory;

    public ImportService(AppDbContext db, IWebHostEnvironment env, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _env = env;
        _scopeFactory = scopeFactory;
    }

    //public async Task<Guid> CreateScheduleImportJobAsync(IFormFile file, int? userId)
    //{
    //    if (file == null || file.Length == 0)
    //        throw new InvalidOperationException("File is empty.");

    //    var jobId = Guid.NewGuid();
    //    var filePath = Path.Combine(_env.ContentRootPath, "Uploads", $"{jobId}.csv");

    //    Directory.CreateDirectory(Path.Combine(_env.ContentRootPath, "Uploads"));

    //    using (var stream = new FileStream(filePath, FileMode.Create))
    //    {
    //        await file.CopyToAsync(stream);
    //    }

    //    var job = new ImportJob
    //    {
    //        JobId = jobId,
    //        UserId = userId,
    //        FileName = file.FileName,
    //        Status = "Pending",
    //        CreatedAt = DateTime.UtcNow,
    //        UpdatedAt = DateTime.UtcNow
    //    };

    //    _db.ImportJobs.Add(job);
    //    await _db.SaveChangesAsync();

    //    _ = Task.Run(async () =>
    //    {
    //        await ProcessScheduleImportAsync(jobId, filePath);
    //    });

    //    return jobId;
    //}

    public async Task<ImportJob?> GetImportJobAsync(Guid jobId)
    {
        return await _db.ImportJobs.AsNoTracking().FirstOrDefaultAsync(j => j.JobId == jobId);
    }

    //private async Task ProcessScheduleImportAsync(Guid jobId, string filePath)
    //{
    //    var job = await _db.ImportJobs.FirstOrDefaultAsync(j => j.JobId == jobId);
    //    if (job == null) return;

    //    try
    //    {
    //        job.Status = "Processing";
    //        job.UpdatedAt = DateTime.UtcNow;
    //        await _db.SaveChangesAsync();

    //        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
    //        {
    //            HeaderValidated = null,
    //            MissingFieldFound = null
    //        };

    //        using var reader = new StreamReader(filePath);
    //        using var csv = new CsvReader(reader, config);

    //        var records = csv.GetRecords<dynamic>().ToList();
    //        job.TotalRows = records.Count;

    //        foreach (var record in records)
    //        {
    //            var dict = (IDictionary<string, object>)record;

    //            var metadata = new Dictionary<string, string>();
    //            foreach (var kv in dict)
    //            {
    //                if (kv.Key.StartsWith("metadata_"))
    //                {
    //                    metadata[kv.Key.Replace("metadata_", "")] = kv.Value?.ToString();
    //                }
    //            }

    //            var schedule = new Schedule
    //            {
    //                CreatedByUserId = int.Parse(dict["createdByUserId"].ToString()),
    //                AssigneeUserId = int.Parse(dict["assigneeUserId"].ToString()),
    //                TeamId = Guid.Parse(dict["teamId"].ToString()),
    //                Title = dict["title"].ToString(),
    //                Description = dict["description"]?.ToString(),
    //                StartAt = DateTime.Parse(dict["startAt"].ToString()),
    //                EndAt = DateTime.Parse(dict["endAt"].ToString()),
    //                RecurrenceRule = dict["recurrenceRule"]?.ToString(),
    //                Metadata = JsonSerializer.Serialize(metadata),
    //                CreatedAt = DateTime.UtcNow,
    //                UpdatedAt = DateTime.UtcNow
    //            };

    //            _db.Schedules.Add(schedule);
    //        }

    //        await _db.SaveChangesAsync();

    //        job.Status = "Completed";
    //        job.Result = "Imported successfully";
    //        job.UpdatedAt = DateTime.UtcNow;
    //        await _db.SaveChangesAsync();
    //    }
    //    catch (Exception ex)
    //    {
    //        job.Status = "Failed";
    //        job.Result = ex.Message;
    //        job.UpdatedAt = DateTime.UtcNow;
    //        await _db.SaveChangesAsync();
    //    }
    //}

    public async Task<Guid> CreateScheduleImportJobAsync(IFormFile file, int? userId)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("File is empty.");

        var jobId = Guid.NewGuid();
        var filePath = Path.Combine(_env.ContentRootPath, "Uploads", $"{jobId}.csv");

        Directory.CreateDirectory(Path.Combine(_env.ContentRootPath, "Uploads"));

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var job = new ImportJob
        {
            JobId = jobId,
            UserId = userId,
            FileName = file.FileName,
            Status = "Pending",
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
        };

        _db.ImportJobs.Add(job);
        await _db.SaveChangesAsync();

        // Run import in background with scoped DbContext
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await ProcessScheduleImportAsyncScoped(jobId, filePath, scopedDb);
        });

        return jobId;
    }

    private async Task ProcessScheduleImportAsyncScoped(Guid jobId, string filePath, AppDbContext db)
    {
        var job = await db.ImportJobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null) return;

        try
        {
            job.Status = "Processing";
            job.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await db.SaveChangesAsync();

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

                int createdByUserId = int.Parse(dict["createdByUserId"].ToString());
                int assigneeUserId = int.Parse(dict["assigneeUserId"].ToString());
                Guid teamId = Guid.Parse(dict["teamId"].ToString());
                string title = dict["title"].ToString();
                string description = dict["description"]?.ToString();

                DateTime startAt = DateTime.Parse(dict["startAt"].ToString(), null, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal);
                DateTime endAt = DateTime.Parse(dict["endAt"].ToString(), null, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal);

                string recurrenceRule = dict["recurrenceRule"]?.ToString();

                // Extract metadata columns starting with "metadata_"
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
                    CreatedByUserId = createdByUserId,
                    AssigneeUserId = assigneeUserId,
                    TeamId = teamId,
                    Title = title,
                    Description = description,
                    StartAt = DateTime.SpecifyKind(startAt, DateTimeKind.Utc),
                    EndAt = DateTime.SpecifyKind(endAt, DateTimeKind.Utc),
                    RecurrenceRule = recurrenceRule,
                    Metadata = JsonSerializer.Serialize(metadata),
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                db.Schedules.Add(schedule);
            }

            await db.SaveChangesAsync();

            job.Status = "Completed";
            job.Result = "Schedules imported successfully";
            job.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            job.Status = "Failed";
            job.Result = ex.Message;
            job.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await db.SaveChangesAsync();
        }
    }

    public async Task<Guid> CreateKpiActualImportJobAsync(IFormFile file, int? userId)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("File is empty.");

        var jobId = Guid.NewGuid();
        var filePath = Path.Combine(_env.ContentRootPath, "Uploads", $"{jobId}.csv");

        Directory.CreateDirectory(Path.Combine(_env.ContentRootPath, "Uploads"));

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var job = new ImportJob
        {
            JobId = jobId,
            UserId = userId,
            FileName = file.FileName,
            Status = "Pending",
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
            UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
        };

        _db.ImportJobs.Add(job);
        await _db.SaveChangesAsync();

        // Run import in background task with scoped DbContext
        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await ProcessKpiActualImportAsyncScoped(jobId, filePath, scopedDb);
        });

        return jobId;
    }

    private async Task ProcessKpiActualImportAsyncScoped(Guid jobId, string filePath, AppDbContext db)
    {
        var job = await db.ImportJobs.FirstOrDefaultAsync(j => j.JobId == jobId);
        if (job == null) return;

        try
        {
            job.Status = "Processing";
            job.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await db.SaveChangesAsync();

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

                int userId = int.Parse(dict["user_id"].ToString());
                int kpiId = int.Parse(dict["kpi_id"].ToString());

                // Safe parsing of period_date with Utc
                DateTime periodDate = DateTime.ParseExact(
                    dict["period_date"].ToString(),
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal
                );
                periodDate = DateTime.SpecifyKind(periodDate, DateTimeKind.Utc);

                decimal actualValue = decimal.Parse(dict["actual_value"].ToString());

                // Skip duplicates
                bool exists = await db.KpiActuals.AnyAsync(a =>
                    a.UserId == userId &&
                    a.KpiId == kpiId &&
                    a.PeriodDate == periodDate
                );

                if (exists) continue;

                var actual = new KpiActual
                {
                    UserId = userId,
                    KpiId = kpiId,
                    PeriodDate = DateTime.SpecifyKind(periodDate, DateTimeKind.Utc),
                    ActualValue = actualValue,
                    Source = "csv_import",
                    ImportJobId = jobId,
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc)
                };

                db.KpiActuals.Add(actual);
            }

            await db.SaveChangesAsync();

            job.Status = "Completed";
            job.Result = "KPI actuals imported successfully";
            job.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            job.Status = "Failed";
            job.Result = ex.Message;
            job.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            await db.SaveChangesAsync();
        }
    }

}
