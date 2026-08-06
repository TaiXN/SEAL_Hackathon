namespace APIViewModels.Dropdown
{
    public class EventDropdownAPIViewModel
    {
        public string EventId { get; set; }
        public string EventName { get; set; }

        public int CurrentTeamCount { get; set; }
        public int MaxTeamCapacity { get; set; }
    }
}