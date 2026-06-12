using DataAccess.Entities;
using DataAccess.Repositories.CriteriaRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CriteriaSetRepository
{
    public class CriteriaSetRepository: Repository<CriteriaSet>, ICriteriaSetRepository
    {
        private readonly SealContext _db;
        public CriteriaSetRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(CriteriaSet criteriaSet)
        {
            _db.CriteriaSets.Update(criteriaSet);
        }
    }
}
