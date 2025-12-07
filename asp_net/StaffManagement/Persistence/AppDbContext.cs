using Microsoft.EntityFrameworkCore;
using StaffManagement.Persistence.Entities;
using System.Text.Json.Nodes;

namespace StaffManagement.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Schedule> Schedules { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<TaskNote> TaskNotes { get; set; }
    public DbSet<ImportJob> ImportJobs { get; set; }

    // --- Phase 6: Training Module ---
    public DbSet<TrainingCourse> TrainingCourses { get; set; }
    public DbSet<TrainingAssignment> TrainingAssignments { get; set; }
    public DbSet<KpiTarget> KpiTargets { get; set; }
    public DbSet<Kpi> Kpis { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Auto-load all IEntityTypeConfiguration<T> classes
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // JSONB conversions
        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.Property(e => e.Metadata)
                .HasConversion(
                    v => JsonConversions.Serialize(v),
                    v => JsonConversions.Deserialize(v)
                )
                .HasColumnType("jsonb");
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(e => e.Metadata)
                .HasConversion(
                    v => JsonConversions.Serialize(v),
                    v => JsonConversions.Deserialize(v)
                )
                .HasColumnType("jsonb");
        });

        modelBuilder.Entity<ImportJob>(entity =>
        {
            entity.Property(e => e.Result)
                .HasConversion(
                    v => JsonConversions.Serialize(v),
                    v => JsonConversions.Deserialize(v)
                )
                .HasColumnType("jsonb");
        });

        base.OnModelCreating(modelBuilder);

    }
}
