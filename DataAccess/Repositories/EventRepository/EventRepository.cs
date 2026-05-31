using DataAccess.Entities;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.EventRepository
{
    public class EventRepository:Repository<Event>,IEventRepository
    {
        private readonly SealContext _db;
        public EventRepository(SealContext db) : base(db)
        {
            _db = db;

        }

        public void Update(Event events){
            _db.Events.Update(events);
        }

    }

}
