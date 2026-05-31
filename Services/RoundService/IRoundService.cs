using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.RoundService
{
    public interface IRoundService
    {
        Task<bool> CreateRoundAsync(Round newRound);
        Task<List<Round>> GetAllRoundsAsync();
        Task<Round> GetRoundByIdAsync(string roundID);
        Task<bool> UpdateRoundAsync(Round roundToUpdate);
        Task<bool> DeleteRoundAsync(string roundID);
    }
}
