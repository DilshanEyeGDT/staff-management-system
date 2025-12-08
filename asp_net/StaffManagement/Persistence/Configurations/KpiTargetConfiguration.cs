using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Persistence.Configurations
{
    public class KpiTargetConfiguration : IEntityTypeConfiguration<KpiTarget>
    {
        public void Configure(EntityTypeBuilder<KpiTarget> builder)
        {
            builder.ToTable("kpi_targets");

            builder.HasKey(x => x.KpiTargetId);

            builder.Property(x => x.KpiTargetId)
                   .HasColumnName("kpi_target_id")
                   .IsRequired();

            builder.Property(x => x.UserId)
                   .HasColumnName("user_id")
                   .IsRequired();

            builder.Property(x => x.KpiId)
                   .HasColumnName("kpi_id")
                   .IsRequired();

            builder.Property(x => x.PeriodStart)
                   .HasColumnName("period_start")
                   .HasColumnType("date")
                   .IsRequired();

            builder.Property(x => x.PeriodEnd)
                   .HasColumnName("period_end")
                   .HasColumnType("date")
                   .IsRequired();

            builder.Property(x => x.TargetValue)
                   .HasColumnName("target_value")
                   // choose precision you want, e.g. numeric(12,2)
                   .HasColumnType("numeric(12,2)")
                   .IsRequired();

            builder.Property(x => x.CreatedAt)
                   .HasColumnName("created_at")
                   .HasDefaultValueSql("NOW()");

            builder.Property(x => x.UpdatedAt)
                   .HasColumnName("updated_at")
                   .HasDefaultValueSql("NOW()");

            // Relationships
            builder.HasOne(x => x.User)
                   .WithMany()    // if you want a collection on User, change accordingly
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Kpi)
                   .WithMany(x => x.KpiTargets)
                   .HasForeignKey(x => x.KpiId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: one target per user + kpi + period
            builder.HasIndex(x => new { x.UserId, x.KpiId, x.PeriodStart, x.PeriodEnd })
                   .IsUnique()
                   .HasDatabaseName("ux_kpi_targets_user_kpi_period");
        }
    }
}
