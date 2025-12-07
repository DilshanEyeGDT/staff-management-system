using System;

namespace StaffManagement.Dtos
{
    public class TrainingAssignmentDto
    {
        public int TrainingAssignmentId { get; set; }
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public DateTime AssignedOn { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal Progress { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation info
        public string UserDisplayName { get; set; }
        public string CourseTitle { get; set; }
    }
}
