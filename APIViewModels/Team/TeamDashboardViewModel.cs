namespace APIViewModels.Team
{
    public class TeamDashboardViewModel
    {
        public string TeamName { get; set; }
        public string CategoryName { get; set; } // Track & Topic name
        public string Description { get; set; }
        public int TotalMembers { get; set; }
    }
}