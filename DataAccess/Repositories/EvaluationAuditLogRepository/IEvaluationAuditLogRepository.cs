using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EvaluationAuditLogRepository
{
    public interface IEvaluationAuditLogRepository : IRepository<EvaluationAuditLog>
    {
        void Update(EvaluationAuditLog evalAudit);
    }
}
