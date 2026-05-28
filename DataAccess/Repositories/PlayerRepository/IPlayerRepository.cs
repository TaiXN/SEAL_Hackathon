using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.PlayerRepository
{
    public interface IPlayerRepository : IRepository<Player>
    {
        void Update(Player player);
    }
}