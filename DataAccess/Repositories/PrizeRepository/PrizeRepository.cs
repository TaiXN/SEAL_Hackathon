using DataAccess.Entities;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.PrizeRepository
{
    public class PrizeRepository:Repository<Prize>,IPrizeRepository
    {
        private readonly SealHackathonContext _db;
        public PrizeRepository(SealHackathonContext db) : base(db)
        {
            _db = db;

        }
        public void Update(Prize prize)
        {
            _db.Prizes.Update(prize);
        }
    }
}
