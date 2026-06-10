using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class MentorAssignment
{
    public string MentorAssignmentId { get; set; } = null!;

    public string MentorId { get; set; } = null!;

    public string CategoryId { get; set; } = null!;

    public virtual Category Category { get; set; } = null!;

    public virtual Teacher Mentor { get; set; } = null!;
}
