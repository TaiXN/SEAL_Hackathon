using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.TeacherRepository;
using System;
using System.Collections.Generic;
using System.Text;

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
