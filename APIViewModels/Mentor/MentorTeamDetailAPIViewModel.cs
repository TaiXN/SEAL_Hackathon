using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Mentor
{
    public class MentorTeamDetailAPIViewModel
    {
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public string EventName { get; set; }
        public string TrackName { get; set; }
        public string RoundName { get; set; }
        public string UrlGithub { get; set; }
        public string UrlDemo { get; set; }
        public string UrlSlide { get; set; }
        public string LeaderEmail { get; set; }
        public List<string> MemberNames { get; set; } 
    }
}
