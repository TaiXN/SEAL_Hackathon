using APIViewModels.Round;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.RoundService
{
    public interface IRoundService
    {
        Task<bool> CreateRoundAsync(CreateRoundAPIViewModel info, string accID);
        Task<bool> UpdateRoundAsync(UpdateRoundAPIViewModel info);
        Task<bool> DeleteRoundAsync(string roundID);
        Task<List<RoundMenuAPIViewModel>> GetActiveMenuAsync();
        Task<(bool IsSuccess, string Message)> AutoTransitionRoundAsync(string currentRoundId);
        Task<List<RoundAPIViewModel>> GetActiveRoundsAsync();
        Task<RoundAPIViewModel> GetRoundByIdAsync(string roundID);
        Task<List<RoundAPIViewModel>> GetAllRoundsAsync();


    }
}
