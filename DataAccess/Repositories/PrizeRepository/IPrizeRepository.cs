using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.PrizeRepository
{
    public interface IPrizeRepository : IRepository<Prize>
    {
        void Update(Prize prize);


    }
}
