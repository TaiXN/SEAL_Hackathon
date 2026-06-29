using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.LeaderBoardRepository
{
    public interface ILeaderBoardRepository : IRepository<LeaderBoard>
    {
        void Update(LeaderBoard leaderboard);
    }
}
