using System;

namespace APIViewModels.Team
{
    public class LeaderboardViewModel
    {
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public string CategoryName { get; set; }
        public double TotalScore { get; set; }
    }
}