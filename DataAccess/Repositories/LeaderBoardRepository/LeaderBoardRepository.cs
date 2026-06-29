using DataAccess.Entities;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.LeaderBoardRepository
{
    public class LeaderBoardRepository : Repository<LeaderBoard>, ILeaderBoardRepository
    {
        private readonly SealContext _db;
        public LeaderBoardRepository(SealContext db) : base(db)
        {
            _db = db;

        }

        public void Update(LeaderBoard leaderboard)
        {
            _db.LeaderBoards.Update(leaderboard);
        }
    }
}
