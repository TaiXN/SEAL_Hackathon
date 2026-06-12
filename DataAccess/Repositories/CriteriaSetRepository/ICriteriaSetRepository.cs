using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CriteriaSetRepository
{
    public interface ICriteriaSetRepository : IRepository<CriteriaSet>
    {
        void Update(CriteriaSet criteriaSet);
    }
}
