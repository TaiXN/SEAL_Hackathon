using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.PrizeRepository
{
    public interface IPrizeRepository
    {
        void Update(Prize prize);
    }
}
