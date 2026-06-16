using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;


namespace DataAccess.Repositories.TeamRepository
{
    public interface ITeamRepository : IRepository<Team>
    {
        void Update(Team team);
    }
}
