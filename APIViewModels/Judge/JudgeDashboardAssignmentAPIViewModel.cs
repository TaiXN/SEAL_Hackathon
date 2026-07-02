using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Judge
{
    public class JudgeDashboardAssignmentAPIViewModel
    {
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public string TrackName { get; set; }
        public string EventName { get; set; }
        public string CriteriaSetId { get; set; }
        public string SubmissionId { get; set; }
        public string EvaluationId { get; set; }
        public double? Score { get; set; }
    }
}
