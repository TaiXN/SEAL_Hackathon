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
                List<TeamInRound> allTeamsInRound = await _uow.TeamInRound.GetAllAsync(
                    q => q.RoundId == roundId && q.TrackId == trackId && q.IsCheck == true && q.IsBanned == false,
                    includeProperties: "Team"
                );

                if (!allTeamsInRound.Any()) return new List<LeaderBoardDisplayAPIViewModel>();

                LeaderBoard leaderboard = await _uow.LeaderBoard.GetFirstOrDefaultAsync(q => q.RoundId == roundId && q.TrackId == trackId);

                List<LeaderBoardDetail> details = new List<LeaderBoardDetail>();
                if (leaderboard != null)
                {
                    details = await _uow.LeaderBoardDetail.GetAllAsync(q => q.LeaderBoardId == leaderboard.Id);
                }

                List<LeaderBoardDisplayAPIViewModel> result = new List<LeaderBoardDisplayAPIViewModel>();

                foreach (TeamInRound team in allTeamsInRound)
                {
                    LeaderBoardDetail teamDetail = details.FirstOrDefault(d => d.TeamInRoundId == team.Id);

                    result.Add(new LeaderBoardDisplayAPIViewModel
                    {
                        TeamInRoundId = team.Id,
                        TeamName = team.Team?.TeamName ?? "N/A",
                        Score = teamDetail != null ? teamDetail.Score : 0
                    });
                }

                return result.OrderByDescending(d => d.Score).ToList();
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
