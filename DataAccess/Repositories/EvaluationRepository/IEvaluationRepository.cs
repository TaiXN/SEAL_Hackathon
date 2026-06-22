using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EvaluationRepository
{
    public interface IEvaluationRepository : IRepository<Evaluation>
    {
        void Update(Evaluation evaluations);
    }
}
