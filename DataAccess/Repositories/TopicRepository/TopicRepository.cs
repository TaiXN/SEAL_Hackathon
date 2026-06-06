using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TopicRepository
{
    public class TopicRepository : Repository<Topic>, ITopicRepository
    {
        private readonly SealHackathonContext _db;
        public TopicRepository(SealHackathonContext db) : base(db) {
            _db = db;
        }
        public void Update(Topic topic) {
            _db.Topics.Update(topic);
        }
    }
}