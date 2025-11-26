namespace StaffManagement.Dtos
{
    public class CreateTaskDto
    {
        public int CreatedByUserId { get; set; }
        public int? AssigneeUserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public short Priority { get; set; } = 1; // default priority
        public string Status { get; set; } = "open";
        public DateTime? DueAt { get; set; }
        public System.Text.Json.Nodes.JsonNode? Metadata { get; set; }
        public string? IdempotencyKey { get; set; }
    }
}
