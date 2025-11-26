using StaffManagement.Persistence.Entities;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities;

public class TaskNote
{
    [Column("task_note_id")]
    public Guid TaskNoteId { get; set; }

    [Column("task_id")]
    public Guid TaskId { get; set; }

    [Column("author_user_id")]
    public int AuthorUserId { get; set; }

    [Column("body")]
    public string Body { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    // Navigation
    public TaskItem Task { get; set; }
    public User AuthorUser { get; set; }
}
