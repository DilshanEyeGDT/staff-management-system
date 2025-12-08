using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StaffManagement.Persistence.Entities;

namespace StaffManagement.Persistence.Configurations
{
    public class KpiConfiguration : IEntityTypeConfiguration<Kpi>
    {
        public void Configure(EntityTypeBuilder<Kpi> builder)
        {
            builder.ToTable("kpis");

            builder.HasKey(x => x.KpiId);

            builder.Property(x => x.KpiId)
                   .HasColumnName("kpi_id")
                   .IsRequired();

            builder.Property(x => x.Name)
                   .HasColumnName("name")
                   .HasMaxLength(100)
                   .IsRequired();

            builder.Property(x => x.Description)
                   .HasColumnName("description");

            builder.Property(x => x.Unit)
                   .HasColumnName("unit")
                   .HasMaxLength(20);

            builder.Property(x => x.Frequency)
                   .HasColumnName("frequency")
                   .HasMaxLength(20);

            builder.Property(x => x.CreatedAt)
                   .HasColumnName("created_at")
                   .HasDefaultValueSql("NOW()");

            builder.Property(x => x.UpdatedAt)
                   .HasColumnName("updated_at")
                   .HasDefaultValueSql("NOW()");
        }
    }
}
