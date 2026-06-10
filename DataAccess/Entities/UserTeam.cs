using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class UserTeam
{
    public string TeamId { get; set; } = null!;

    public string PlayerId { get; set; } = null!;

    public bool IsLeader { get; set; }

    public bool InviteStatus { get; set; }

    public virtual Player Player { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;
}
