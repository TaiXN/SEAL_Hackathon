using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class MentorAssignment
{
    public string MentorAssignmentId { get; set; } = null!;
    public string MentorId { get; set; } = null!;

    public string TrackId { get; set; } = null!;
    public virtual Track Track { get; set; } = null!;
    public virtual Teacher Mentor { get; set; } = null!;
}