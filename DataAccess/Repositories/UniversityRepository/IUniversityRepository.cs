using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.UniversityRepository
{
    public interface IUniversityRepository : IRepository<University>
    {
        void Update(University uni);
    }
}