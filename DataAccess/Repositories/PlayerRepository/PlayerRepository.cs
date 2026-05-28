using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.PlayerRepository
{
    public class PlayerRepository : Repository<Player>, IPlayerRepository
    {

        private readonly SealHackathonContext _db;
        public PlayerRepository(SealHackathonContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Player player)
        {
            _db.Players.Update(player);
        }
    }
}