using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.PrizeRepository
{
    public class PrizeRepository : Repository<Prize>, IPrizeRepository
    {
        private readonly SealContext _db;
        public PrizeRepository(SealContext db) : base(db)
        {
            _db = db;
        }
        public void Update(Prize prize)
        {
            _db.Prizes.Update(prize);
        }


    }
}