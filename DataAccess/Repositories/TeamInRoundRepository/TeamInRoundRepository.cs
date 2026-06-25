using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.SubmissionRepository;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeamInRoundRepository
{
    public class TeamInRoundRepository : Repository<TeamInRound>, ITeamInRoundRepository
    {
        private readonly SealContext _db;
        public TeamInRoundRepository(SealContext db) : base(db)
        {
            _db = db;
        }
        public void Update(TeamInRound teaminround)
        {
            _db.TeamInRounds.Update(teaminround);
        }
    }
}
