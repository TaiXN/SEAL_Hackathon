using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.JudgeRepository
{
    public class JudgeRepository:Repository<Judge>, IJudgeRepository
    {
        private readonly SealContext _db;
        public JudgeRepository(SealContext db):base(db)
        {
            _db = db;
        }
    }
}
