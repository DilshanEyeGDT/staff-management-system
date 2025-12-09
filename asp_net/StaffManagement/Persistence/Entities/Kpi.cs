using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities
{
    [Table("kpis")]
    public class Kpi
    {
        [Column("kpi_id")]
        public int KpiId { get; set; }

        [Column("name")]
        public string Name { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("unit")]
        public string Unit { get; set; }

        [Column("frequency")]
        public string Frequency { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<KpiTarget> KpiTargets { get; set; }
    }
}
