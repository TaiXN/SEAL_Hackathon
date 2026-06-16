using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Evaluation
{
    public string Id { get; set; } = null!;

    public string SubmissionId { get; set; } = null!;

    public string TeacherId { get; set; } = null!;

    public double Score { get; set; }

    public string Reason { get; set; } = null!;

    public virtual Submission Submission { get; set; } = null!;
}
