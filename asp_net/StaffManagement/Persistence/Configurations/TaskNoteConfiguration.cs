using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffManagement.Persistence.Entities;

public class TaskNoteConfiguration : IEntityTypeConfiguration<TaskNote>
{
    public void Configure(EntityTypeBuilder<TaskNote> builder)
    {
        builder.ToTable("task_notes");

        builder.HasKey(x => x.TaskNoteId);

        builder.HasOne(x => x.Task)
            .WithMany(t => t.Notes)
            .HasForeignKey(x => x.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AuthorUser)
            .WithMany(u => u.NotesWritten)
            .HasForeignKey(x => x.AuthorUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
