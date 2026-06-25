using APIViewModels.Dropdown;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Services.DropdownService
{
    public interface IDropdownService
    {
        Task<List<EventDropdownAPIViewModel>> GetActiveEventsAsync();
        Task<List<TrackDropdownAPIViewModel>> GetTracksByEventAsync(string eventId);
        Task<List<TopicDropdownAPIViewModel>> GetTopicsByTrackAsync(string trackId);
    }
}
