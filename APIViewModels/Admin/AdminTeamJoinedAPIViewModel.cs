using APIViewModels.Team;
using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Admin
{
    public class AdminTeamJoinedAPIViewModel
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public string TrackName { get; set; } = string.Empty;
        public string TopicName { get; set; } = string.Empty;
        public int TotalMembers { get; set; }
        public bool IsBanned { get; set; }

        public List<TeamMemberAPIViewModel> Members { get; set; } = new List<TeamMemberAPIViewModel>();
    }
}
