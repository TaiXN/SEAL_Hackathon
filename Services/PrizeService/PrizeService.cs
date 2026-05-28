using DataAccess.Entities;
using DataAccess.Repositories.PrizeRepository;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Collections.Generic;
using System.Security.Principal;
using System.Text;

namespace Services.PrizeService
{
    public class PrizeService : IPrizeService
    {
        private readonly IUnitOfWork _uow;

        public PrizeService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateAsync(Prize prize)
        {
            try
            {
                    Prize newPrize = new Prize()
                    {
                        PrizeId = prize.PrizeId,
                        PrizeName = prize.PrizeName,
                        EventId = prize.EventId,

                    };
                    await _uow.Prize.AddAsync(newPrize);     
                    await _uow.SaveAsync();
                    return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


    }
}
