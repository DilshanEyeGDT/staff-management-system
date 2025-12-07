using System;

namespace StaffManagement.Dtos
{
    public class UpdateTrainingAssignmentDto
    {
        public int? Progress { get; set; }        // optional
        public string? Status { get; set; }       // optional
        public DateTime? DueDate { get; set; }    // optional
    }
}
