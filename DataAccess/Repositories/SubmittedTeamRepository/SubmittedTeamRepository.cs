using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TeamInRoundRepository
{
    public class TeamInRoundRepository : Repository<TeamInRound>, ITeamInRoundRepository
    {
        private readonly SealHackathonContext _db;
        public TeamInRoundRepository(SealHackathonContext db) : base(db) {
            _db = db; 
        }
        public void Update(TeamInRound teamInRound) {
            _db.TeamInRounds.Update(teamInRound);
        }
    }
}