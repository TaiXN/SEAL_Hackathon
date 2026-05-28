using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.PrizeService
{
    public interface IPrizeService
    {
        Task<bool> CreateAsync(Prize prize);
    }
}
