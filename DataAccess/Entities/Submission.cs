using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Submission
{
    public string Id { get; set; } = null!;
    public string TeamInRoundId { get; set; } = null!;
    public string UrlGithub { get; set; } = null!;

    public virtual TeamInRound TeamInRound { get; set; } = null!;
    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();
}