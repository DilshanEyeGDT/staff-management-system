namespace StaffManagement.Dtos
{
    public class TaskNoteResponseDto
    {
        public Guid TaskNoteId { get; set; }
        public Guid TaskId { get; set; }
        public int AuthorUserId { get; set; }
        public string Body { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
