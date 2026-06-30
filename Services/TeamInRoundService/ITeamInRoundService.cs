using APIViewModels.TeamInRound;
using APIViewModels.TeamProject;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.TeamInRoundService
{
    public interface ITeamInRoundService
    {
        Task<bool> CreateTeamInRoundAsync(string accountId, string teamId, SubmitProjectAPIViewModel request);
        Task<bool> CheckTeamInRoundAsync(string teamInRoundId);
        Task<bool> BanTeamInRoundAsync(string teamInRoundId);
        Task<bool> UnbanTeamInRoundAsync(string teamInRoundId);
        Task<List<TeamInRoundDetailAPIViewModel>> GetTeamsDetailsByRoundIdAsync(string roundId);

    }
}
