using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities
{
    [Table("training_courses")]
    public class TrainingCourse
    {
        [Column("training_course_id")]
        public int CourseId { get; set; }

        [Column("title")]
        public string Title { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("category")]
        public string Category { get; set; }

        [Column("duration_hours")]
        public int DurationHours { get; set; }

        [Column("link")]
        public string? Link { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
