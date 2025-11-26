using StaffManagement.Persistence.Entities;
using System;
using System.Text.Json.Nodes;

namespace StaffManagement.Persistence.Entities;

public class TaskItem
{
    public Guid TaskId { get; set; }

    public int CreatedByUserId { get; set; }
    public int? AssigneeUserId { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }

    public short Priority { get; set; }
    public string Status { get; set; }
    public DateTime? DueAt { get; set; }

    public JsonNode? Metadata { get; set; }
    public string IdempotencyKey { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public User CreatedByUser { get; set; }
    public User AssigneeUser { get; set; }
    public ICollection<TaskNote> Notes { get; set; }
}
