using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TrackRepository
{
    public class TrackRepository : Repository<Track>, ITrackRepository
    {
        private readonly SealContext _db;
        public TrackRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Track track)
        {
            _db.Tracks.Update(track);
        }
    }
}
