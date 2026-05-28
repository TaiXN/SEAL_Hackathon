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

    public virtual Account CreatorNavigation { get; set; } = null!;

    public virtual ICollection<Criterion> Criteria { get; set; } = new List<Criterion>();

    public virtual Event Event { get; set; } = null!;

    public virtual ICollection<JudgeAssignment> JudgeAssignments { get; set; } = new List<JudgeAssignment>();

    public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
