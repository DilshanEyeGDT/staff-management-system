using StaffManagement.Persistence.Entities;
using System;

namespace StaffManagement.Persistence.Entities;

public class TaskNote
{
    public Guid TaskNoteId { get; set; }

    public Guid TaskId { get; set; }
    public int AuthorUserId { get; set; }

    public string Body { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation
    public TaskItem Task { get; set; }
    public User AuthorUser { get; set; }
}
