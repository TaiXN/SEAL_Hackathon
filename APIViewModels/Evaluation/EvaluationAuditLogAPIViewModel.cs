using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Evaluation
{
    public class EvaluationAuditLogAPIViewModel
    {
        public string LogId { get; set; } = string.Empty;
        public string EvaluationId { get; set; } = string.Empty;
        public string JudgeId { get; set; } = string.Empty;
        public string JudgeName { get; set; } = string.Empty;
        public double OldScore { get; set; }
        public double NewScore { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
