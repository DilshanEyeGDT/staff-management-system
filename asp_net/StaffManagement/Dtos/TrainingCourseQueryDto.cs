namespace StaffManagement.Dtos
{
    public class TrainingCourseQueryDto
    {
        public string? Query { get; set; }
        public int Page { get; set; } = 1;
        public int Size { get; set; } = 10;
    }
}
