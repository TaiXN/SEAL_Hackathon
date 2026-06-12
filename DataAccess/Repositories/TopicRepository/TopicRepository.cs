using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.TeacherRepository;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TopicRepository
{
    public class TopicRepository : Repository<Topic>, ITopicRepository
    {
        private readonly SealContext _db;
        public TopicRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Topic topic)
        {
            _db.Topics.Update(topic);
        }
    }
}
