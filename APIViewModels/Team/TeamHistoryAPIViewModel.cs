namespace APIViewModels.Team
{
    public class TeamHistoryAPIViewModel
    {
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public bool IsLeader { get; set; }
        public string EventId { get; set; } 
        public string EventName { get; set; }
    }
}