using System;
using System.Text.Json.Nodes;

namespace StaffManagement.Dtos
{
    public class ScheduleDto
    {
        public Guid ScheduleId { get; set; }
        public int CreatedByUserId { get; set; }
        public int? AssigneeUserId { get; set; }
        public Guid? TeamId { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTimeOffset StartAt { get; set; }
        public DateTimeOffset EndAt { get; set; }
        public string? RecurrenceRule { get; set; }
        public JsonNode? Metadata { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        public DateTimeOffset? DeletedAt { get; set; }
    }
}
