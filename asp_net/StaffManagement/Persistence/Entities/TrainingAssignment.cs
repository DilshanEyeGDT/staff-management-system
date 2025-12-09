using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities
{
    [Table("training_assignments")]
    public class TrainingAssignment
    {
        [Column("training_assignment_id")]
        public int TrainingAssignmentId { get; set; }

        [Column("course_id")]
        public int CourseId { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("assigned_on")]
        public DateTime AssignedOn { get; set; } = DateTime.UtcNow;

        [Column("due_date")]
        public DateTime? DueDate { get; set; }

        [Column("progress")]
        public decimal Progress { get; set; } = 0;

        [Column("status")]
        public string Status { get; set; } = "pending";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; }
        public TrainingCourse Course { get; set; }
    }
}
