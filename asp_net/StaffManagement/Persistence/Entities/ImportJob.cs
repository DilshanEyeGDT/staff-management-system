using StaffManagement.Persistence.Entities;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Nodes;

namespace StaffManagement.Persistence.Entities;

[Table("import_jobs")]
public class ImportJob
{
    [Column("job_id")]
    public Guid JobId { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [Column("file_name")]
    public string FileName { get; set; }

    [Column("total_rows")]
    public int? TotalRows { get; set; }

    [Column("status")]
    public string Status { get; set; }

    [Column("result")]
    public JsonNode? Result { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; }
}
