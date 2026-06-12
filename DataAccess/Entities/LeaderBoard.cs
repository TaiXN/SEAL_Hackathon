using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class LeaderBoard
{
    public string Id { get; set; } = null!;

    public string TrackId { get; set; } = null!;

    public string RoundId { get; set; } = null!;

    public virtual ICollection<LeaderBoardDetail> LeaderBoardDetails { get; set; } = new List<LeaderBoardDetail>();

    public virtual Round Round { get; set; } = null!;

    public virtual Track Track { get; set; } = null!;
}
