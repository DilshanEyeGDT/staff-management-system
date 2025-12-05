using StaffManagement.Persistence.Entities;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Nodes;

namespace StaffManagement.Persistence.Entities;

[Table("tasks")]
public class TaskItem
{
    [Column("task_id")]
    public Guid TaskId { get; set; }

    [Column("created_by_user_id")]
    public int CreatedByUserId { get; set; }

    [Column("assignee_user_id")]
    public int? AssigneeUserId { get; set; }

    [Column("title")]
    public string Title { get; set; }

    [Column("description")]
    public string Description { get; set; }

    [Column("priority")]
    public short Priority { get; set; }

    [Column("status")]
    public string Status { get; set; }

    [Column("due_at")]
    public DateTime? DueAt { get; set; }

    [Column("metadata")]
    public JsonNode? Metadata { get; set; }

    [Column("idempotency_key")]
    public string IdempotencyKey { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public User CreatedByUser { get; set; }
    public User AssigneeUser { get; set; }
    public ICollection<TaskNote> Notes { get; set; }
}
