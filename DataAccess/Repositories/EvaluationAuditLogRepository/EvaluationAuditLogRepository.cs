using DataAccess.Entities;
using DataAccess.Repositories.EvaluationRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EvaluationAuditLogRepository
{
    public class EvaluationAuditLogRepository : Repository<EvaluationAuditLog>, IEvaluationAuditLogRepository
    {
        private readonly SealContext _db;
        public EvaluationAuditLogRepository(SealContext db) : base(db)
        {
            _db = db;

        }

        public void Update(EvaluationAuditLog evalAudit)
        {
            _db.EvaluationAuditLogs.Update(evalAudit);
        }
    }
}
