using StaffManagement.Persistence.Entities;
using System;
using System.Text.Json.Nodes;

namespace StaffManagement.Persistence.Entities;

public class ImportJob
{
    public Guid JobId { get; set; }

    public int? UserId { get; set; }

    public string FileName { get; set; }
    public int? TotalRows { get; set; }
    public string Status { get; set; }

    public JsonNode? Result { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; }
}
