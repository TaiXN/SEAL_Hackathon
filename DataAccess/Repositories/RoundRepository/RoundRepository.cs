using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RoundRepository
{
    public class RoundRepository : Repository<Round>, IRoundRepository
    {
        private readonly SealContext _db;
        public RoundRepository(SealContext db) : base(db)
        {
            _db = db;

        }
        public void Update(Round round)
        {
            _db.Rounds.Update(round);
        }
    }
}
