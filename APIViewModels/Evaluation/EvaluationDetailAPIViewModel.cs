using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Evaluation
{
    public class EvaluationDetailAPIViewModel
    {
        public string EvaluationID { get; set; } 
        public string SubmissionID { get; set; }
        public string TeacherID { get; set; }
        public string TeacherName { get; set; }
        public double? Score { get; set; }
        public string Reason { get; set; }
    }
}
