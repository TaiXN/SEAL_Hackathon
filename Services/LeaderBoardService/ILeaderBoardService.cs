using APIViewModels.LeaderBoard;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.LeaderBoardService
{
    public interface ILeaderBoardService
    {
        Task<bool> UpdateRankRealTimeAsync(string roundId, string trackId, string teamInRoundId, double finalScore);

        Task<List<LeaderBoardDisplayAPIViewModel>> GetLeaderBoardAsync(string roundId, string trackId);
        Task<List<LeaderBoard>> GetAllLeaderBoardAsync();
    }
}
