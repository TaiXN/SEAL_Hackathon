using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.SubmittedTeamRepository
{
    public interface ISubmittedTeamRepository : IRepository<SubmittedTeam>
    {
        void Update(SubmittedTeam submittedTeam);
    }
}