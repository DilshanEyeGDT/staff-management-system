using System;

namespace StaffManagement.Dtos
{
    public class AssignTrainingDto
    {
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
