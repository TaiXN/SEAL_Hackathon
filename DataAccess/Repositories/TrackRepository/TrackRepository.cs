using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TrackRepository
{
    public class TrackRepository : Repository<Track>, ITrackRepository
    {
        private readonly SealHackathonContext _db;
        public TrackRepository(SealHackathonContext db) : base(db)
        {
            _db = db;
        }
        public void Update(Track track) {
            _db.Tracks.Update(track);
        }
    }
}