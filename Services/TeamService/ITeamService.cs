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
        //Task<bool> SubmitTrackAsync(string teamId, string CategoryId);
        Task<List<TeamMemberAPIViewModel>> GetMyTeamAsync(string accountId);

        Task<bool> CreateTeamAsync(string accountId, string teamName);
        Task<DateTime?> GetCountdownDeadlineAsync();
              
        Task<bool> KickMemberAsync(string teamId, string memberToKickPlayerId, string requesterAccountId);
                
        Task<bool> LeaveTeamAsync(string teamId, string requesterAccountId);
        Task<bool> TransferLeaderRoleAsync(string teamId, string newLeaderPlayerId, string requesterAccountId);

        Task<bool> JoinTeamDirectlyAsync(string teamId, string requesterAccountId);

        Task<TeamDashboardViewModel> GetMyTeamDashboardAsync(string accountId);

        //Task<UpdateTeamAPIViewModel> UpdateTeamInfoAsync(string teamName, string description);
        Task<bool> UpdateTeamInfoAsync(string accountId, UpdateTeamAPIViewModel request);


    }
}
    