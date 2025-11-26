using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffManagement.Persistence.Entities;

public class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.ToTable("schedules");

        builder.HasKey(x => x.ScheduleId);

        builder.Property(x => x.Title).HasMaxLength(255).IsRequired();

        builder.HasOne(x => x.CreatedByUser)
            .WithMany(u => u.CreatedSchedules)
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AssigneeUser)
            .WithMany(u => u.AssignedSchedules)
            .HasForeignKey(x => x.AssigneeUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
