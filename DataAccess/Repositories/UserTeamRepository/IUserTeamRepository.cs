using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TeamMemberRepository
{
    public interface ITeamMemberRepository : IRepository<TeamMember>
    {
        void Update(TeamMember teamMember);
    }
}