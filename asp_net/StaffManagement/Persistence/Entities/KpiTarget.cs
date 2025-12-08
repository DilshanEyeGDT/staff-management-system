using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities
{
    [Table("kpi_targets")]
    public class KpiTarget
    {
        [Column("kpi_target_id")]
        public int KpiTargetId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("kpi_id")]
        public int KpiId { get; set; }

        [Column("period_start")]
        public DateTime PeriodStart { get; set; }

        [Column("period_end")]
        public DateTime PeriodEnd { get; set; }

        [Column("target_value")]
        public decimal TargetValue { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; }
        public Kpi Kpi { get; set; }
    }
}
