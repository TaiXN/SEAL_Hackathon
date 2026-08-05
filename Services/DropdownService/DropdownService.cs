using APIViewModels.Dropdown;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
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
            List<Event> events = await _uow.Event.GetAllAsync(e => e.IsActive == true);
            return events.Select(e => new EventDropdownAPIViewModel
            {
                EventId = e.EventId,
                EventName = e.EventName
            }).ToList();
        }

        public async Task<List<TrackDropdownAPIViewModel>> GetTracksByEventAsync(string eventId)
        {
            List<Track> tracks = await _uow.Track.GetAllAsync(t => t.EventId == eventId && t.IsActive == true);
            return tracks.Select(t => new TrackDropdownAPIViewModel
            {
                TrackId = t.TrackId,
                TrackName = t.TrackName
            }).ToList();
        }

        public async Task<List<TopicDropdownAPIViewModel>> GetTopicsByTrackAsync(string trackId)
        {
            List<Topic> topics = await _uow.Topic.GetAllAsync(t => t.TrackId == trackId && t.IsActive == true);
            return topics.Select(t => new TopicDropdownAPIViewModel
            {
                TopicId = t.TopicId,
                TopicName = t.TopicDetail
            }).ToList();
        }

        public async Task<List<TrackDropdownAPIViewModel>> GetTracksByTeamAsync(string teamId)
        {
            List<string> trackIds = await _uow.TeamInRound.GetAllQueryable()
                .Where(tr => tr.TeamId == teamId)
                .Select(tr => tr.TrackId)
                .Distinct()
                .ToListAsync();

            if (!trackIds.Any()) return new List<TrackDropdownAPIViewModel>();

            List<TrackDropdownAPIViewModel> teamTracks = await _uow.Track.GetAllQueryable()
                .Where(t => trackIds.Contains(t.TrackId) && t.IsActive == true)
                .Select(t => new TrackDropdownAPIViewModel
                {
                    TrackId = t.TrackId,
                    TrackName = t.TrackName
                })
                .ToListAsync();

            return teamTracks;
        }

        public async Task<List<RoundDropdownAPIViewModel>> GetRoundsByTeamAndTrackAsync(string teamId, string trackId)
        {
            List<string> roundIds = await _uow.TeamInRound.GetAllQueryable()
                .Where(tr => tr.TeamId == teamId && tr.TrackId == trackId)
                .Select(tr => tr.RoundId)
                .Distinct()
                .ToListAsync();

            if (!roundIds.Any()) return new List<RoundDropdownAPIViewModel>();

            List<RoundDropdownAPIViewModel> teamRounds = await _uow.Round.GetAllQueryable()
                .Where(r => roundIds.Contains(r.RoundId) && r.IsActive == true)
                .Select(r => new RoundDropdownAPIViewModel
                {
                    RoundId = r.RoundId,
                    RoundName = r.RoundName
                })
                .ToListAsync();

            return teamRounds;
        }
    }
}