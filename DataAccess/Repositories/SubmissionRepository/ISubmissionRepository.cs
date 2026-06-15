using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.SubmissionRepository
{
    public interface ISubmissionRepository : IRepository<Submission>
    {
        void Update(Submission submission);
    }
}