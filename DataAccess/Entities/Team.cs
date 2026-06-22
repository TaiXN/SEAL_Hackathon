using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Team
{
    public string TeamId { get; set; } = null!;

    public string TeamName { get; set; } = null!;

    public string? EventId { get; set; }

    public virtual Event? Event { get; set; }

    public virtual ICollection<TeamInRound> TeamInRounds { get; set; } = new List<TeamInRound>();

    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
}
