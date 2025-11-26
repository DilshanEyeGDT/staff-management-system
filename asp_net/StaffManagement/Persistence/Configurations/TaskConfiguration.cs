using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffManagement.Persistence.Entities;

public class TaskConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("tasks");

        builder.HasKey(x => x.TaskId);

        builder.Property(x => x.Title).HasMaxLength(255).IsRequired();

        builder.HasOne(x => x.CreatedByUser)
            .WithMany(u => u.CreatedTasks)
            .HasForeignKey(x => x.CreatedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AssigneeUser)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(x => x.AssigneeUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
