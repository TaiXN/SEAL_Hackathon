using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Evaluation
{
    public class EvaluationAPIViewModel
    {
        [Required]
        public string SubmissionID { get; set; }

        [Required]
        public double Score { get; set; }

        [Required]
        public string Reason { get; set; }

        public string TrackID { get; set; }
    }
}
