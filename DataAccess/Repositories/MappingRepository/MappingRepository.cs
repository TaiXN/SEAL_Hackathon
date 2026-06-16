using DataAccess.Entities;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.MappingRepository
{
    public class MappingRepository : Repository<Mapping>, IMappingRepository
    {
        private readonly SealContext _db;
        public MappingRepository(SealContext db) : base(db)
        {
            _db = db;

        }

        public void Update(Mapping mapping)
        {
            _db.Mappings.Update(mapping);
        }
    }
}
