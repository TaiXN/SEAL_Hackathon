using APIViewModels.Dropdown;
using DataAccess.Repositories.UnitOfWork;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services.DropdownService
{
    public class DropdownService : IDropdownService
    {
        private readonly IUnitOfWork _uow;

        public DropdownService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<List<EventDropdownAPIViewModel>> GetActiveEventsAsync()
        {
            var events = await _uow.Event.GetAllAsync(e => e.IsActive == true);
            return events.Select(e => new EventDropdownAPIViewModel
            {
                EventId = e.EventId,
                EventName = e.EventName
            }).ToList();
        }

        public async Task<List<TrackDropdownAPIViewModel>> GetTracksByEventAsync(string eventId)
        {
            var tracks = await _uow.Track.GetAllAsync(t => t.EventId == eventId && t.IsActive == true);
            return tracks.Select(t => new TrackDropdownAPIViewModel
            {
                TrackId = t.TrackId,
                TrackName = t.TrackName
            }).ToList();
        }

        public async Task<List<TopicDropdownAPIViewModel>> GetTopicsByTrackAsync(string trackId)
        {
            var topics = await _uow.Topic.GetAllAsync(t => t.TrackId == trackId && t.IsActive == true);
            return topics.Select(t => new TopicDropdownAPIViewModel
            {
                TopicId = t.TopicId,
                TopicName = t.TopicDetail
            }).ToList();
        }
    }
}
