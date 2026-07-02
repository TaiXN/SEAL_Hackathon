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

        public async Task<List<LeaderBoardDisplayAPIViewModel>> GetLeaderBoardAsync(string roundId, string trackId)
        {
            try
            {
                LeaderBoard leaderboard = await _uow.LeaderBoard.GetFirstOrDefaultAsync(q => q.RoundId == roundId && q.TrackId == trackId);

              
                if (leaderboard == null) return new List<LeaderBoardDisplayAPIViewModel>();

                
                List<LeaderBoardDetail> details = await _uow.LeaderBoardDetail.GetAllAsync(
                    q => q.LeaderBoardId == leaderboard.Id,
                    includeProperties: "TeamInRound,TeamInRound.Team"
                );

              
                List<LeaderBoardDisplayAPIViewModel> result = details
                    .OrderByDescending(d => d.Score)
                    .Select(d => new LeaderBoardDisplayAPIViewModel
                    {
                        TeamInRoundId = d.TeamInRoundId,
                        TeamName = d.TeamInRound?.Team?.TeamName ?? "N/A",
                        Score = d.Score
                    }).ToList();

                return result;
            }
            catch (Exception ex)
            {
                return new List<LeaderBoardDisplayAPIViewModel>();
            }
        }

        public async Task<List<LeaderBoard>> GetAllLeaderBoardAsync()
        {
            try
            {
                List<LeaderBoard> result = await _uow.LeaderBoard.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<LeaderBoard>();
            }
        }


    }
}
