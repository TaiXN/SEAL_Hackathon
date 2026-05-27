using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RoundRepository
{
    public interface IRoundRepository
    {
        void Update(Round round);
    }
}
