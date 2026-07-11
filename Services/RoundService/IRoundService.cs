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
        Task<List<Round>> GetAllRoundsAsync();
        Task<Round> GetRoundByIdAsync(string roundID);
        Task<bool> UpdateRoundAsync(UpdateRoundAPIViewModel info);
        Task<bool> DeleteRoundAsync(string roundID);
        Task<List<RoundMenuAPIViewModel>> GetActiveMenuAsync();
        Task<(bool IsSuccess, string Message)> AutoTransitionRoundAsync(string currentRoundId);

    }
}
