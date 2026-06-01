using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CriteriaRepository
{
    public interface ICriteriaRepository: IRepository<Criterion>
    {
        void Update(Criterion criteria);
    }
}
