using APIViewModels.LeaderBoard;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.LeaderBoardService
{
    public class LeaderBoardService : ILeaderBoardService
    {
        private readonly IUnitOfWork _uow;
        public LeaderBoardService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> UpdateRankRealTimeAsync(string roundId, string trackId, string teamInRoundId, double finalScore)
        {
            try
            {

                LeaderBoard leaderboard = await _uow.LeaderBoard.GetFirstOrDefaultAsync(q => q.RoundId == roundId && q.TrackId == trackId);
                if (leaderboard == null)
                {
                    leaderboard = new LeaderBoard()
                    {
                        Id = Guid.NewGuid().ToString(),
                        RoundId = roundId,
                        TrackId = trackId
                    };
                    await _uow.LeaderBoard.AddAsync(leaderboard);
                    await _uow.SaveAsync();
                }


                LeaderBoardDetail detail = await _uow.LeaderBoardDetail.GetFirstOrDefaultAsync(q => q.LeaderBoardId == leaderboard.Id && q.TeamInRoundId == teamInRoundId);

                if (detail != null)
                {

                    detail.Score = finalScore;
                    _uow.LeaderBoardDetail.Update(detail);
                }
                else
                {

                    detail = new LeaderBoardDetail()
                    {
                        Id = Guid.NewGuid().ToString(),
                        LeaderBoardId = leaderboard.Id,
                        TeamInRoundId = teamInRoundId,
                        Score = finalScore
                    };
                    await _uow.LeaderBoardDetail.AddAsync(detail);
                }

                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


    }
}
