using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities
{
    [Table("kpi_actuals")]
    public class KpiActual
    {
        [Column("kpi_actual_id")]
        public int KpiActualId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("kpi_id")]
        public int KpiId { get; set; }

        [Column("period_date")]
        public DateTime PeriodDate { get; set; }

        [Column("actual_value")]
        public decimal ActualValue { get; set; }

        [Column("source")]
        public string Source { get; set; }

        [Column("import_job_id")]
        public Guid? ImportJobId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; }
        public Kpi Kpi { get; set; }
    }
}
