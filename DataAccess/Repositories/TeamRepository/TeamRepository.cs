using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.RepositoryBase;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeamRepository
{
    public class TeamRepository : Repository<Team>, ITeamRepository//inheritance,implementation()
    {
        private readonly SealContext _db;
        public TeamRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Team team)//method
        {
            _db.Teams.Update(team);
        }

       
    }
}


