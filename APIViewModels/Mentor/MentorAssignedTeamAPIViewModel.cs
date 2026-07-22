using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Mentor
{
    public class MentorAssignedTeamAPIViewModel
    {
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public string TrackId { get; set; }
        public string TrackName { get; set; }
        public string EventName { get; set; }
    }
}
