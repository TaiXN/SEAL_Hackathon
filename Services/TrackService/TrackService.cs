using APIViewModels.Track;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;

namespace Services.TrackService
{
    public class TrackService : ITrackService
    {
        private readonly IUnitOfWork _uow;
        public TrackService(IUnitOfWork uow)
        {
            _uow = uow;
        }


        public async Task<bool> CreateTrackAsync(CreateTrackAPIViewModel info, string accId)
        {
            try
            {
                Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == info.EventId && e.IsActive);
                if (eventDb == null) return false;


                Track duplicateCheck = await _uow.Track.GetFirstOrDefaultAsync(t =>
                    t.EventId == info.EventId &&
                    t.TrackName.ToLower() == info.TrackName.ToLower() &&
                    t.IsActive);
                if (duplicateCheck != null) return false;


                Track newTrack = new Track()
                {
                    TrackId = Guid.NewGuid().ToString(),
                    Creator = accId,
                    EventId = info.EventId,
                    TrackName = info.TrackName,
                    IsActive = true
                };

                await _uow.Track.AddAsync(newTrack);

                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
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
                    IsActive = t.IsActive
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateTrackAsync(string trackID, UpdateTrackAPIViewModel info)
        {
            try
            {
                Track trackDb = await _uow.Track.GetFirstOrDefaultAsync(r => r.TrackId == trackID && r.IsActive);
                if (trackDb == null) return false;

                Track duplicateCheck = await _uow.Track.GetFirstOrDefaultAsync(t =>
                     t.EventId == info.EventID &&
                     t.TrackName.ToLower() == info.TrackName.ToLower() &&
                     t.IsActive);
                if (duplicateCheck != null) return false;

                trackDb.TrackName = info.TrackName;

                _uow.Track.Update(trackDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
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
