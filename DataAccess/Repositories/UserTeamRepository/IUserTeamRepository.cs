using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.UserTeamRepository
{
    public interface IUserTeamRepository : IRepository<UserTeam>
    {
        void Update(UserTeam userTeam);
    }
}