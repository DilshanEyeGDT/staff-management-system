namespace StaffManagement.Dtos
{
    public class TrainingCourseDto
    {
        public int CourseId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string Category { get; set; }
        public int DurationHours { get; set; }
        public string? Link { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
