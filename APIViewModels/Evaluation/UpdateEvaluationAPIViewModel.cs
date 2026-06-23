using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Evaluation
{
    public class UpdateEvaluationAPIViewModel
    {
        public double Score { get; set; }
        public string Reason { get; set; }
        public string EvaluationID { get; set; }
    }
}
