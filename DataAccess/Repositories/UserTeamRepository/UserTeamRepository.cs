using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TeamMemberRepository
{
    public class TeamMemberRepository : Repository<TeamMember>, ITeamMemberRepository
    {
        private readonly SealHackathonContext _db;
        public TeamMemberRepository(SealHackathonContext db) : base(db) {
            _db = db;
        }
        public void Update(TeamMember teamMember) { 
            _db.TeamMembers.Update(teamMember);
        }
    }
}