using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EventRepository
{
    public interface IEventRepository:IRepository<Event>
    {
        void Update(Event events);
        
    }
}
