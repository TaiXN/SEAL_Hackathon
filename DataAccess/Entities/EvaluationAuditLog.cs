using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class EvaluationAuditLog
{
    public string Id { get; set; } = null!;

    public string EvaluationId { get; set; } = null!;

    public string JudgeId { get; set; } = null!;

    public double OldScore { get; set; }

    public double NewScore { get; set; }

    public string Reason { get; set; } = null!;

    public DateTime Timestamp { get; set; }

    public virtual Evaluation Evaluation { get; set; } = null!;

    public virtual Account Judge { get; set; } = null!;
}
