using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeamRepository
{
    public class TeamRepository : Repository<Team>, ITeamRepository//inheritance,implementation()
    {
        private readonly SealHackathonContext _db;
        public TeamRepository(SealHackathonContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Team team)//method
        {
            _db.Teams.Update(team);
        }
    }
}


