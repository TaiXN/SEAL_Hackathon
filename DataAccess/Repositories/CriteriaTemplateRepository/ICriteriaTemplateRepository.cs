using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CriteriaTemplateRepository
{
    public interface ICriteriaTemplateRepository : IRepository<CriteriaTemplate>
    {
        void Update(CriteriaTemplate criteriaTemplate);
    }
}
