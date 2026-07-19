namespace APIViewModels.Team
{
    public class TeamDashboardAPIViewModel
    {
        public string TeamName { get; set; }
        public string EventName { get; set; } 
        public string CategoryName { get; set; }
        public int TotalMembers { get; set; }
        public string CurrentRoundName { get; set; }
        public int CurrentRoundIndex { get; set; }
        public bool IsEliminated { get; set; }
        public string StatusMessage { get; set; }

    }
}