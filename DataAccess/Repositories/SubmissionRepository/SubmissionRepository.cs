using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.SubmissionRepository
{
    public class SubmissionRepository : Repository<Submission>, ISubmissionRepository
    {
        private readonly SealHackathonContext _db;
        public SubmissionRepository(SealHackathonContext db) : base(db) {
            _db = db;
        }
        public void Update(Submission submission) {
            _db.Submissions.Update(submission); 
        }
    }
}