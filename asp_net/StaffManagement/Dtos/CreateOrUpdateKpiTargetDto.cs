using System;

namespace StaffManagement.Dtos
{
    public class CreateOrUpdateKpiTargetDto
    {
        public int UserId { get; set; }
        public int KpiId { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal TargetValue { get; set; }
    }
}
