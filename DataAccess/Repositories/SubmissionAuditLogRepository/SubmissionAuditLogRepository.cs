using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.SubmissionAuditLogRepository
{
    public class SubmissionAuditLogRepository : Repository<SubmissionAuditLog>, ISubmissionAuditLogRepository
    {
        private readonly SealContext _db;

        public SubmissionAuditLogRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(SubmissionAuditLog submissionAuditLog)
        {
            _db.SubmissionAuditLogs.Update(submissionAuditLog);
        }
    }
}