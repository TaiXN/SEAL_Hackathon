using DataAccess.Entities;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EvaluationRepository
{
    public class EvaluationRepository : Repository<Evaluation>, IEvaluationRepository
    {
        private readonly SealContext _db;
        public EvaluationRepository(SealContext db) : base(db)
        {
            _db = db;

        }

        public void Update(Evaluation evaluations)
        {
            _db.Evaluations.Update(evaluations);
        }
    }
}
