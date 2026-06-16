using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TrackRepository
{
    public interface ITrackRepository : IRepository<Track>
    {
        void Update(Track track);
    }
}
