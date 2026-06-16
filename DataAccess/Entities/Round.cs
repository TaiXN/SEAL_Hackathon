using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Round
{
    public string RoundId { get; set; } = null!;

    public string EventId { get; set; } = null!;

    public string Creator { get; set; } = null!;

    public string RoundName { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int TopNpromotion { get; set; }

    public int MaxTeam { get; set; }

    public bool IsActive { get; set; }

    public int RoundIndex { get; set; }

    public string CriteriaSetId { get; set; } = null!;

    public virtual CriteriaSet CriteriaSet { get; set; } = null!;

    public virtual Event Event { get; set; } = null!;

    public virtual ICollection<LeaderBoard> LeaderBoards { get; set; } = new List<LeaderBoard>();

    public virtual ICollection<TeamInRound> TeamInRounds { get; set; } = new List<TeamInRound>();
}
