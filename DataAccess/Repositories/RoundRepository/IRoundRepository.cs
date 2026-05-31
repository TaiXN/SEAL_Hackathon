using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RoundRepository
{
    public interface IRoundRepository : IRepository<Round>
    {
        void Update(Round round);
    }
}
