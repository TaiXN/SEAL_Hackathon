using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.TopicRepository
{
    public interface ITopicRepository : IRepository<Topic>
    {
        void Update(Topic topic);
    }
}