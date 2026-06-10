using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class JudgeAssignment
{
    public string JudgeAssignmentId { get; set; } = null!;

    public string JudgeId { get; set; } = null!;

    public string RoundId { get; set; } = null!;

    public string TeamId { get; set; } = null!;

    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();

    public virtual Teacher Judge { get; set; } = null!;

    public virtual Round Round { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;
}
