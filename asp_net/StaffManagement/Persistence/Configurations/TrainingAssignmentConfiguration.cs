using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Persistence.Configurations
{
    public class TrainingAssignmentConfiguration : IEntityTypeConfiguration<TrainingAssignment>
    {
        public void Configure(EntityTypeBuilder<TrainingAssignment> builder)
        {
            builder.ToTable("training_assignments");

            builder.HasKey(t => t.TrainingAssignmentId);

            builder.HasOne(t => t.User)
                   .WithMany() // no navigation collection needed in User for assignments
                   .HasForeignKey(t => t.UserId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.Course)
                   .WithMany() // no navigation collection needed in TrainingCourse for assignments
                   .HasForeignKey(t => t.CourseId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(t => t.Status)
                   .HasMaxLength(20)
                   .HasDefaultValue("pending");

            builder.Property(t => t.Progress)
                   .HasDefaultValue(0);

            builder.Property(t => t.AssignedOn)
                   .HasDefaultValueSql("NOW()");

            builder.Property(t => t.CreatedAt)
                   .HasDefaultValueSql("NOW()");

            builder.Property(t => t.UpdatedAt)
                   .HasDefaultValueSql("NOW()");
        }
    }
}
