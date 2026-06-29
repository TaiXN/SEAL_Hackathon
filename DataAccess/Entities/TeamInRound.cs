using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class TeamInRound
{
    public string Id { get; set; } = null!;

    public string TeamId { get; set; } = null!;

    public string TrackId { get; set; } = null!;

    public bool IsBanned { get; set; }

    public bool IsCheck { get; set; }

    public string RoundId { get; set; } = null!;

    public string TopicId { get; set; } = null!;


    public virtual ICollection<LeaderBoardDetail> LeaderBoardDetails { get; set; } = new List<LeaderBoardDetail>();

    public virtual Round Round { get; set; } = null!;

    public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();

    public virtual Team Team { get; set; } = null!;

    public virtual Topic Topic { get; set; } = null!;

    public virtual Track Track { get; set; } = null!;
}
