using APIViewModels.Prize;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.PrizeService
{
    public interface IPrizeService
    {
        Task<(bool IsSuccess, string Message)> CreatePrizeAsync(CreatePrizeAPIViewModel request);
        Task<List<PrizeAPIViewModel>> GetAllPrizesAsync();
        Task<PrizeAPIViewModel> GetPrizeByIdAsync(string prizeId);
        Task<List<PrizeAPIViewModel>> GetPrizesByEventIdAsync(string eventId);
        Task<(bool IsSuccess, string Message)> UpdatePrizeAsync(string prizeId, UpdatePrizeAPIViewModel request);
        Task<(bool IsSuccess, string Message)> DeletePrizeAsync(string prizeId);
        Task<(bool IsSuccess, string Message)> ReActivePrizeAsync(string prizeId);
        Task<(bool IsSuccess, string Message)> ManualAssignPrizeAsync(PrizeAPIViewModel request);
        
    }
}
