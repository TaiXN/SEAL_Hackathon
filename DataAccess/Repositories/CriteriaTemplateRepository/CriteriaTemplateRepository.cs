using DataAccess.Entities;
using DataAccess.Repositories.CriteriaRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CriteriaTemplateRepository
{
    public class CriteriaTemplateRepository: Repository<CriteriaTemplate>, ICriteriaTemplateRepository
    {
        private readonly SealContext _db;
        public CriteriaTemplateRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(CriteriaTemplate criteriaTemplate)
        {
            _db.CriteriaTemplates.Update(criteriaTemplate);
        }
    }
}
