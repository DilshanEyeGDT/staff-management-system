using System;

namespace StaffManagement.Dtos
{
    public class KpiTargetDto
    {
        public int KpiTargetId { get; set; }
        public int UserId { get; set; }
        public int KpiId { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal TargetValue { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public string UserDisplayName { get; set; }
        public string KpiName { get; set; }
        public string Message { get; set; }  // created / updated
    }
}
