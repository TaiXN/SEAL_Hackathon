using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class TeamMember
{
    public string TeamId { get; set; } = null!;

    public string StudentId { get; set; } = null!;

    public bool IsLeader { get; set; }
    public bool InviteStatus { get; set; }

    public virtual Student Student { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;
}