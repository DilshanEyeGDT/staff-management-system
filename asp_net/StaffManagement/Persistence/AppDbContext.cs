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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Fix JSONB mapping for Schedule.Metadata
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

    }
}
