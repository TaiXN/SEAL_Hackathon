using APIViewModels.Track;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services.TrackService
{
    public class TrackService : ITrackService
    {
        private readonly IUnitOfWork _uow;
        public TrackService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<(bool IsSuccess, string Message)> CreateTrackAsync(CreateTrackAPIViewModel info, string accId)
        {
            try
            {
                if (info.MaxTeam <= 0)
                    return (false, "Maximum number of teams must be greater than 0.");

                Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == info.EventId && e.IsActive);
                if (eventDb == null)
                    return (false, "Event does not exist or is inactive.");

                Round round1 = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == info.EventId && r.RoundIndex == 1);
                if (round1 != null)
                {
                    List<Track> currentTracks = await _uow.Track.GetAllAsync(t => t.EventId == info.EventId && t.IsActive);
                    int totalCurrentMax = currentTracks.Sum(t => t.MaxTeam);

                    if (totalCurrentMax + info.MaxTeam > round1.MaxTeam)
                    {
                        int slotsLeft = round1.MaxTeam - totalCurrentMax;
                        return (false, $"Capacity exceeded! The event allows a total of {round1.MaxTeam} teams. Current tracks use {totalCurrentMax} slots. You can only allocate up to {slotsLeft} more teams for this new track.");
                    }
                }

                Track duplicateCheck = await _uow.Track.GetFirstOrDefaultAsync(t =>
                    t.EventId == info.EventId &&
                    t.TrackName.ToLower() == info.TrackName.ToLower() &&
                    t.IsActive);
                if (duplicateCheck != null)
                    return (false, "A track with this name already exists in the event.");

                Track newTrack = new Track()
                {
                    TrackId = Guid.NewGuid().ToString(),
                    Creator = accId,
                    EventId = info.EventId,
                    TrackName = info.TrackName,
                    MaxTeam = info.MaxTeam,
                    IsActive = true
                };

                await _uow.Track.AddAsync(newTrack);
                await _uow.SaveAsync();

                return (true, "Track successfully created.");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<List<TrackAPIViewModel>> GetAllTracksAsync()
        {
            try
            {
                List<Track> result = await _uow.Track.GetAllAsync();

                return result.Select(t => new TrackAPIViewModel
                {
                    TrackId = t.TrackId,
                    EventId = t.EventId,
                    Creator = t.Creator,
                    TrackName = t.TrackName,
                    MaxTeam = t.MaxTeam,
                    IsActive = t.IsActive
                }).ToList();
            }
            catch
            {
                return new List<TrackAPIViewModel>();
            }
        }

        public async Task<TrackAPIViewModel> GetTrackByIdAsync(string trackID)
        {
            try
            {
                Track t = await _uow.Track.GetFirstOrDefaultAsync(e => e.TrackId == trackID);
                if (t == null) return null;

                return new TrackAPIViewModel
                {
                    TrackId = t.TrackId,
                    EventId = t.EventId,
                    Creator = t.Creator,
                    TrackName = t.TrackName,
                    MaxTeam = t.MaxTeam,
                    IsActive = t.IsActive
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<(bool IsSuccess, string Message)> UpdateTrackAsync(string trackID, UpdateTrackAPIViewModel info)
        {
            try
            {
                if (info.MaxTeam <= 0)
                    return (false, "Maximum number of teams must be greater than 0.");

                Track trackDb = await _uow.Track.GetFirstOrDefaultAsync(r => r.TrackId == trackID && r.IsActive);
                if (trackDb == null)
                    return (false, "Track does not exist or has been deleted.");

                Round round1 = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == trackDb.EventId && r.RoundIndex == 1);
                if (round1 != null)
                {
                    List<Track> otherTracks = await _uow.Track.GetAllAsync(t => t.EventId == trackDb.EventId && t.IsActive && t.TrackId != trackID);
                    int totalOtherMax = otherTracks.Sum(t => t.MaxTeam);

                    if (totalOtherMax + info.MaxTeam > round1.MaxTeam)
                    {
                        int slotsLeft = round1.MaxTeam - totalOtherMax;
                        return (false, $"Capacity exceeded! The event allows a total of {round1.MaxTeam} teams. Other tracks currently use {totalOtherMax} slots. You can only set a maximum of {slotsLeft} teams for this track.");
                    }
                }

                Track duplicateCheck = await _uow.Track.GetFirstOrDefaultAsync(t =>
                     t.EventId == info.EventID &&
                     t.TrackName.ToLower() == info.TrackName.ToLower() &&
                     t.TrackId != trackID &&
                     t.IsActive);
                if (duplicateCheck != null)
                    return (false, "A track with this name already exists in the event.");

                trackDb.TrackName = info.TrackName;
                trackDb.MaxTeam = info.MaxTeam;

                _uow.Track.Update(trackDb);
                await _uow.SaveAsync();

                return (true, "Track successfully updated.");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<bool> DeleteTrackAsync(string trackID)
        {
            try
            {
                Track trackDb = await _uow.Track.GetFirstOrDefaultAsync(r => r.TrackId == trackID && r.IsActive);
                if (trackDb == null) return false;

                trackDb.IsActive = false;

                _uow.Track.Update(trackDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}