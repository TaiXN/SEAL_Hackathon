namespace APIViewModels.Team
{
    public class TeamHistoryAPIViewModel
    {
        public string TeamId { get; set; }
        public string TeamName { get; set; }
        public bool IsLeader { get; set; }

        public List<JoinedEventInfo> Events { get; set; }
    }
}