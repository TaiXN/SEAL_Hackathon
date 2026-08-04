using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.SubmissionAuditLogRepository
{
    public interface ISubmissionAuditLogRepository : IRepository<SubmissionAuditLog>
    {
        void Update(SubmissionAuditLog submissionAuditLog);
    }
}