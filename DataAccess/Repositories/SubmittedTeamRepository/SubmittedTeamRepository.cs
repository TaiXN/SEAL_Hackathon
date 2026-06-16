using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TeamInRoundRepository
{
    public class TeamInRoundRepository : Repository<TeamInRound>, ITeamInRoundRepository
    {
        private readonly SealContext _db;
        public TeamInRoundRepository(SealContext db) : base(db) {
            _db = db; 
        }
        public void Update(TeamInRound teamInRound) {
            _db.TeamInRounds.Update(teamInRound);
        }
    }
}