using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EventRepository
{
    public interface IEventRepository
    {
        void Update(Event events);
        }
    }
}
