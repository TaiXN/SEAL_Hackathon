using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeamInRoundRepository
{
    public interface ITeamInRoundRepository : IRepository<TeamInRound>
    {
        void Update(TeamInRound teaminround);
    }
}
