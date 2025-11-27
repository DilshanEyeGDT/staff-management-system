namespace StaffManagement.Dtos
{
    public class UpdateTaskDto
    {
        public string? Status { get; set; }       // Editable status
        public string? Title { get; set; }        // Optional editable fields
        public string? Description { get; set; }
        public short? Priority { get; set; }
        public DateTime? DueAt { get; set; }
        public int? AssigneeUserId { get; set; }
    }

}
