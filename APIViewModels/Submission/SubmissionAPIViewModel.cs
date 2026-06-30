using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Submission
{
    public class SubmissionAPIViewModel
    {
        public string SubmissionId { get; set; }
        public string TeamInRoundId { get; set; }
        public string UrlGithub { get; set; }
        public string UrlDemo { get; set; }
        public string UrlSlide { get; set; }
        public double? AverageScore { get; set; }
    }
}
