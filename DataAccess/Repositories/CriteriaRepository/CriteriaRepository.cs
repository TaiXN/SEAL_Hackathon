using DataAccess.Entities;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CriteriaRepository
{
    public class CriteriaRepository: Repository<Criterion>, ICriteriaRepository
    {
        private readonly SealContext _db;
        public CriteriaRepository(SealContext db) : base(db)
        {
            _db = db;

        }
        public void Update(Criterion criteria)
        {
            _db.Criteria.Update(criteria);
        }
    }
}
