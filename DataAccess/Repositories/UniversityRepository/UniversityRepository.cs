using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.UniversityRepository
{
    public class UniversityRepository : Repository<University>, IUniversityRepository
    {
        private readonly SealContext _db;
        public UniversityRepository(SealContext db) : base(db)
        {
            _db = db;
        }
    }
}