using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Topic
{
    public string TopicId { get; set; } = null!;

    public string TrackId { get; set; } = null!;

    public string TopicDetail { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<TeamInRound> TeamInRounds { get; set; } = new List<TeamInRound>();

    public virtual Track Track { get; set; } = null!;
}
