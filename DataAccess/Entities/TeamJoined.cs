using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class TeamJoined
{
    public string Id { get; set; } = null!;

    public string TeamId { get; set; } = null!;

    public string CategoryId { get; set; } = null!;

    public bool IsBanned { get; set; }

    public bool IsCheck { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;
}
