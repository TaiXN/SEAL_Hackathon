using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.EventRepository
{
    public interface IEventRepository : IRepository<Event>
    {
        void Update(Event events);
    }
}