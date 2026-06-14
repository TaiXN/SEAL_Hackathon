using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.RoundRepository
{
    public class RoundRepository : Repository<Round>, IRoundRepository
    {
        private readonly SealContext _db;
        public RoundRepository(SealContext db) : base(db)
        {
            _db = db;

        }
        public void Update(Round round)
        {
            _db.Rounds.Update(round);
        }
    }
}
