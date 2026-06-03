using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.SubmittedTeamRepository
{
    public class SubmittedTeamRepository : Repository<SubmittedTeam>, ISubmittedTeamRepository
    {
        private readonly SealHackathonContext _db;

        public SubmittedTeamRepository(SealHackathonContext db) : base(db)
        {
            _db = db;
        }

        public void Update(SubmittedTeam submittedTeam)
        {
            _db.SubmittedTeams.Update(submittedTeam);
        }
    }
}