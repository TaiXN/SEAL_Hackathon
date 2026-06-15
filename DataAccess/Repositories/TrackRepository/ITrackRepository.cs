using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TrackRepository
{
    public interface ITrackRepository : IRepository<Track>
    {
        void Update(Track track);
    }
}