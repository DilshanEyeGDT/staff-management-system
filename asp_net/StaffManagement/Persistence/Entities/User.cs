using System;
using System.Collections.Generic;

namespace StaffManagement.Persistence.Entities;

public class User
{
    public int Id { get; set; }
    public string CognitoSub { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string DisplayName { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastLogin { get; set; }

    // Navigation
    public ICollection<Schedule> CreatedSchedules { get; set; }
    public ICollection<Schedule> AssignedSchedules { get; set; }

    public ICollection<TaskItem> CreatedTasks { get; set; }
    public ICollection<TaskItem> AssignedTasks { get; set; }

    public ICollection<TaskNote> NotesWritten { get; set; }
}
