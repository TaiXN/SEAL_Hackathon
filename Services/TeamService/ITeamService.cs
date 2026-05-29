using DataAccess.Entities;
using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.Text;
using APIViewModels.Team;

namespace Services.TeamService
{
    public interface ITeamService
    {
        Task<bool> SubmitTrackAsync(string teamId, string CategoryId);
        Task<List<MyTeamMemberViewModel>> GetMyTeamAsync(string accountId);
        Task<List<APIViewModels.Team.LeaderboardViewModel>> GetLeaderboardAsync();
        Task<bool> CreateTeamAsync(string accountId, string teamName, string categoryId, string description);
    }
}
