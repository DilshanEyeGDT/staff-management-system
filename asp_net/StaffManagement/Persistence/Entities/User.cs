using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace StaffManagement.Persistence.Entities;

[Table("users")]
public class User
{
    [Column("id")]
    public int Id { get; set; }

    [Column("cognito_sub")]
    public string CognitoSub { get; set; }

    [Column("username")]
    public string Username { get; set; }

    [Column("email")]
    public string Email { get; set; }

    [Column("display_name")]
    public string DisplayName { get; set; }

    [Column("status")]
    public string Status { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [Column("last_login")]
    public DateTime? LastLogin { get; set; }

    // Navigation
    public ICollection<Schedule> CreatedSchedules { get; set; }
    public ICollection<Schedule> AssignedSchedules { get; set; }

    public ICollection<TaskItem> CreatedTasks { get; set; }
    public ICollection<TaskItem> AssignedTasks { get; set; }

    public ICollection<TaskNote> NotesWritten { get; set; }
}
