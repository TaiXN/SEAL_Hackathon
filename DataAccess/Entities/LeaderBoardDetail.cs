using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class LeaderBoardDetail
{
    public string Id { get; set; } = null!;

    public string LeaderBoardId { get; set; } = null!;

    public string TeamInRoundId { get; set; } = null!;

    public double Score { get; set; }

    public virtual LeaderBoard LeaderBoard { get; set; } = null!;

    public virtual TeamInRound TeamInRound { get; set; } = null!;
}
