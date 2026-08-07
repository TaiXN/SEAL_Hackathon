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

        Task<List<TeamHistoryAPIViewModel>> GetMyTeamHistoryAsync(string accountId);
        Task<List<TeamMemberAPIViewModel>> GetTeamMembersAsync(string teamId, string accountId);
        Task<bool> CreateTeamAsync(string accountId, CreateTeamAPIViewModel request);
        Task<List<TeamDashboardAPIViewModel>> GetMyTeamDashboardAsync(string accountId, string teamId);
        Task<DateTime?> GetCountdownDeadlineAsync(string teamId, string eventId);

        Task<bool> KickMemberAsync(string teamId, string memberToKickPlayerId, string requesterAccountId);
                
        Task<bool> LeaveTeamAsync(string teamId, string requesterAccountId);
        Task<bool> TransferLeaderRoleAsync(string teamId, string newLeaderPlayerId, string requesterAccountId);

        Task<bool> JoinTeamDirectlyAsync(string teamId, string requesterAccountId);
        Task<bool> UpdateTeamInfoAsync(string accountId, string teamId, UpdateTeamAPIViewModel request);
        //Task<List<TeamInEventAPIViewModel>> GetTeamsInEventAsync(string eventId);
    }
}
    