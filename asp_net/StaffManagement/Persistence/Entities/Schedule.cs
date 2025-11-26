using StaffManagement.Persistence.Entities;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Nodes;

namespace StaffManagement.Persistence.Entities;

public class Schedule
{
    [Column("schedule_id")]
    public Guid ScheduleId { get; set; }

    [Column("created_by_user_id")]
    public int CreatedByUserId { get; set; }

    [Column("assignee_user_id")]
    public int AssigneeUserId { get; set; }

    [Column("team_id")]
    public Guid? TeamId { get; set; }

    [Column("title")]
    public string Title { get; set; }

    [Column("description")]
    public string Description { get; set; }

    [Column("start_at")]
    public DateTime StartAt { get; set; }

    [Column("end_at")]
    public DateTime EndAt { get; set; }

    [Column("recurrence_rule")]
    public string RecurrenceRule { get; set; }

    [Column("metadata")]
    public JsonNode? Metadata { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public User CreatedByUser { get; set; }
    public User AssigneeUser { get; set; }
}
