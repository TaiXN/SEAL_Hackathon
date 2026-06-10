using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Team
{
    public string TeamId { get; set; } = null!;

    public string CategoryId { get; set; } = null!;

    public string TeamName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<JudgeAssignment> JudgeAssignments { get; set; } = new List<JudgeAssignment>();

    public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();

    public virtual ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
}
