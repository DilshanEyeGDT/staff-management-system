using System;
using System.Text.Json.Nodes;

namespace StaffManagement.Dtos
{
    public class CreateScheduleDto
    {
        public int CreatedByUserId { get; set; }  // User creating the schedule
        public int? AssigneeUserId { get; set; }  // Optional assignee
        public Guid? TeamId { get; set; }         // Optional team
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public string? RecurrenceRule { get; set; }
        public JsonNode? Metadata { get; set; }
    }
}
