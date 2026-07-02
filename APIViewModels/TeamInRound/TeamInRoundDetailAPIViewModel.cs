using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.TeamInRound
{
    public class TeamInRoundDetailAPIViewModel
    {
        public string TeamInRoundID { get; set; }
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;

        public string TrackId { get; set; } = string.Empty;
        public string TrackName { get; set; } = string.Empty;

        public string RoundId { get; set; } = string.Empty;
        public string RoundName { get; set; } = string.Empty;

        public string TopicId { get; set; } = string.Empty;
        public bool? IsBanned { get; set; }
        public bool? IsCheck { get; set; }
    }
}
