using System;

namespace StaffManagement.Dtos
{
    public class KpiMetricSnapshotDto
    {
        public int KpiId { get; set; }
        public string KpiName { get; set; }
        public decimal TargetValue { get; set; }
        public decimal ActualValue { get; set; }
        public decimal? Difference { get; set; }
        public decimal? Progress { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }
}
