using APIViewModels.Prize;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.PrizeService
{
    public interface IPrizeService
    {
        Task<(bool IsSuccess, string Message)> ManualAssignPrizeAsync(PrizeAPIViewModel request);
        Task<(bool IsSuccess, string Message)> CreatePrizeAsync(CreatePrizeAPIViewModel request);
        Task<List<Prize>> GetAllPrizesAsync();
        Task<Prize> GetPrizeByIdAsync(string prizeId);
        Task<(bool IsSuccess, string Message)> UpdatePrizeAsync(string prizeId, UpdatePrizeAPIViewModel request);
        Task<(bool IsSuccess, string Message)> DeletePrizeAsync(string prizeId);
    }
}
