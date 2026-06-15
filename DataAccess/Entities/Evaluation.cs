using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Evaluation
{
    public string EvaluationId { get; set; } = null!;

    public string JudgeAssignmentId { get; set; } = null!;

    public string SubmissionId { get; set; } = null!;

    public string CriteriaId { get; set; } = null!;

    public double Score { get; set; }

    public string Feedback { get; set; } = null!;

    public bool IsLocked { get; set; }



    public virtual Submission Submission { get; set; } = null!;
}
