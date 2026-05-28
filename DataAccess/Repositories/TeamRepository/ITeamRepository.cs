using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeamRepository
{
    public interface ITeamRepository : IRepository<Team>
    {
        void Update(Team team);
    }
}
