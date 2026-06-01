using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.UserTeamRepository
{
    public class UserTeamRepository : Repository<UserTeam>, IUserTeamRepository
    {
        private readonly SealHackathonContext _db;

        public UserTeamRepository(SealHackathonContext db) : base(db)
        {
            _db = db;
        }

        
        public void Update(UserTeam userTeam)
        {
            _db.UserTeams.Update(userTeam);
        }
    }
}