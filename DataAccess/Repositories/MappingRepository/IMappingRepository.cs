using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.MappingRepository
{
    public interface IMappingRepository : IRepository<Mapping>
    {
       void Update(Mapping mapping);
    }
}
