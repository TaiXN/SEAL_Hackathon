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
        Task<bool> UpdateRoundAsync(string id, UpdateRoundAPIViewModel info);
        Task<bool> DeleteRoundAsync(string roundID);
    }
}
