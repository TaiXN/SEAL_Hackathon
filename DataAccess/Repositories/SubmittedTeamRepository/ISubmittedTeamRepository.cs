using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TeamInRoundRepository
{
    public interface ITeamInRoundRepository : IRepository<TeamInRound>
    {
        void Update(TeamInRound teamInRound);
    }
}