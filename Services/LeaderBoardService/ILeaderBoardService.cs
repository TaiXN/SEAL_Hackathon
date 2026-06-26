using APIViewModels.LeaderBoard;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.LeaderBoardService
{
    public interface ILeaderBoardService
    {
        Task<bool> UpdateRankRealTimeAsync(string roundId, string trackId, string teamInRoundId, double finalScore);
    }
}
