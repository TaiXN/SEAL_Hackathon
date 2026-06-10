using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Submission
{
    public string SubmissionId { get; set; } = null!;

    public string TeamId { get; set; } = null!;

    public string RoundId { get; set; } = null!;

    public string ProjectName { get; set; } = null!;

    public string ProjectUrl { get; set; } = null!;

    public string DemoUrl { get; set; } = null!;

    public string SlideUrl { get; set; } = null!;

    public DateTime SubmitTime { get; set; }

    public virtual ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();

    public virtual Round Round { get; set; } = null!;

    public virtual Team Team { get; set; } = null!;
}
