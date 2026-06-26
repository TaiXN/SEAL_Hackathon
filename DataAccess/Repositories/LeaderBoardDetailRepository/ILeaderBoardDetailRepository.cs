using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.LeaderBoardDetailRepository
{
    public interface ILeaderBoardDetailRepository : IRepository<LeaderBoardDetail>
    {
        void Update(LeaderBoardDetail leaderboarddetail);
    }
}
