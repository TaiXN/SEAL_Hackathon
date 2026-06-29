using DataAccess.Entities;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.LeaderBoardDetailRepository
{
    public class LeaderBoardDetailRepository : Repository<LeaderBoardDetail>, ILeaderBoardDetailRepository
    {
        private readonly SealContext _db;
        public LeaderBoardDetailRepository(SealContext db) : base(db)
        {
            _db = db;

        }

        public void Update(LeaderBoardDetail leaderboarddetail)
        {
            _db.LeaderBoardDetails.Update(leaderboarddetail);
        }
    }
}
