using System.Text.Json.Nodes;

namespace StaffManagement.Dtos
{
    public class TaskDto
    {
        public Guid TaskId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public short Priority { get; set; }
        public string Status { get; set; }
        public DateTime? DueAt { get; set; }
        public int CreatedByUserId { get; set; }
        public int? AssigneeUserId { get; set; }
        public int NotesCount { get; set; }
    }
}
