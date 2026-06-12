using APIViewModels.Round;
using APIViewModels.Track;
using DataAccess.Entities;

namespace Services.TrackService
{
    public interface ITrackService
    {
        Task<bool> CreateTrackAsync(CreateTrackAPIViewModel info, string accId);
        Task<List<Track>> GetAllTracksAsync();
        Task<Track> GetTrackByIdAsync(string trackID);
        Task<bool> UpdateTrackAsync(string trackID, UpdateTrackAPIViewModel info);
        Task<bool> DeleteTrackAsync(string trackID);
       
       
    }
}
