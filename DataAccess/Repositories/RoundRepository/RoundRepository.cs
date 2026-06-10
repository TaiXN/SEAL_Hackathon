using DataAccess.Entities;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RoundRepository
{
    public class RoundRepository : Repository<Round>, IRoundRepository
    {
        private readonly SealHackathonContext _db;
        public RoundRepository(SealHackathonContext db) : base(db)
        {
            _db = db;

        }
        public void Update(Round round)
        {
            _db.Rounds.Update(round);
        }
    }
}
