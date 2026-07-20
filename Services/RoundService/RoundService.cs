using APIViewModels.Round;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;

namespace Services.RoundService
{
    public class RoundService : IRoundService
    {
        private readonly IUnitOfWork _uow;

        public RoundService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateRoundAsync(CreateRoundAPIViewModel info, string accID)
        {
            try
            {
                DateTime vnNow = DateTime.UtcNow.AddHours(7);

          
                DateTime startDateVn = info.StartDate.ToUniversalTime().AddHours(7);
                DateTime endDateVn = info.EndDate.ToUniversalTime().AddHours(7);


                if (startDateVn >= endDateVn)
                {
                    return false;
                }

                if (startDateVn < vnNow)
                {
                    return false;
                }

                List<Round> existingRounds = await _uow.Round.GetAllQueryable()
              .Where(e => e.EventId == info.EventID)
              .ToListAsync();

                if (existingRounds.Count > 0)
                {
                    DateTime earliestStartDate = existingRounds.Min(r => r.StartDate);

                    if (vnNow >= earliestStartDate)
                    {
                        return false;
                    }
                }

                CriteriaSet targetSet = await _uow.CriteriaSet.GetFirstOrDefaultAsync(e => e.CriteriaSetId == info.CriteriaSetID && e.IsActive);
                if (targetSet == null) return false;

                Round duplicateName = await _uow.Round.GetFirstOrDefaultAsync(e => e.EventId == info.EventID && e.RoundName.ToLower() == info.RoundName.ToLower() && e.IsActive);
                if (duplicateName != null) return false;

                List<Round> count = await _uow.Round.GetAllAsync(e => e.EventId == info.EventID);
                int RoundIndex = count.Count() + 1;
                Round newRound = new Round()
                {
                    RoundId = Guid.NewGuid().ToString(),
                    EventId = info.EventID,
                    Creator = accID,
                    RoundName = info.RoundName,
                    StartDate = startDateVn,
                    EndDate = endDateVn,
                    TopNpromotion = info.TopNPromotion,
                    MaxTeam = info.MaxTeam,
                    IsActive = true,
                    RoundIndex = RoundIndex,
                    CriteriaSetId = info.CriteriaSetID
                };
                await _uow.Round.AddAsync(newRound);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<RoundAPIViewModel>> GetAllRoundsAsync()
        {
            try
            {
                List<Round> result = await _uow.Round.GetAllAsync();
                return result.Select(r => new RoundAPIViewModel
                {
                    RoundId = r.RoundId,
                    EventId = r.EventId,
                    Creator = r.Creator,
                    RoundName = r.RoundName,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    TopNpromotion = r.TopNpromotion,
                    MaxTeam = r.MaxTeam,
                    IsActive = r.IsActive,
                    RoundIndex = r.RoundIndex,
                    CriteriaSetId = r.CriteriaSetId
                }).ToList();
            }
            catch
            {
                return new List<RoundAPIViewModel>();
            }
        }

        public async Task<RoundAPIViewModel> GetRoundByIdAsync(string roundID)
        {
            try
            {
                Round r = await _uow.Round.GetFirstOrDefaultAsync(e => e.RoundId == roundID);
                if (r == null) return null;

                return new RoundAPIViewModel
                {
                    RoundId = r.RoundId,
                    EventId = r.EventId,
                    Creator = r.Creator,
                    RoundName = r.RoundName,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    TopNpromotion = r.TopNpromotion,
                    MaxTeam = r.MaxTeam,
                    IsActive = r.IsActive,
                    RoundIndex = r.RoundIndex,
                    CriteriaSetId = r.CriteriaSetId
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<RoundAPIViewModel>> GetActiveRoundsAsync()
        {
            try
            {
                DateTime vnNow = DateTime.UtcNow.AddHours(7);
                List<Round> result = await _uow.Round.GetAllAsync(q => q.IsActive && q.StartDate <= vnNow);

                return result.Select(r => new RoundAPIViewModel
                {
                    RoundId = r.RoundId,
                    EventId = r.EventId,
                    Creator = r.Creator,
                    RoundName = r.RoundName,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    TopNpromotion = r.TopNpromotion,
                    MaxTeam = r.MaxTeam,
                    IsActive = r.IsActive,
                    RoundIndex = r.RoundIndex,
                    CriteriaSetId = r.CriteriaSetId
                }).ToList();
            }
            catch
            {
                return new List<RoundAPIViewModel>();
            }
        }

        public async Task<bool> UpdateRoundAsync(UpdateRoundAPIViewModel info)
        {
            try
            {
                Round roundDb = await _uow.Round.GetFirstOrDefaultAsync(q => q.RoundId.Equals(info.RoundID));
                if (roundDb == null)
                {
                    return false;
                }

                DateTime vnNow = DateTime.UtcNow.AddHours(7);
                DateTime startDateVn = info.StartDate.ToUniversalTime().AddHours(7);
                DateTime endDateVn = info.EndDate.ToUniversalTime().AddHours(7);

                if (startDateVn >= endDateVn) return false;
                if (startDateVn < vnNow) return false;

                roundDb.EventId = info.EventID;
                roundDb.RoundName = info.RoundName;
                roundDb.StartDate = startDateVn;
                roundDb.EndDate = endDateVn;
                roundDb.TopNpromotion = info.TopNPromotion;
                roundDb.MaxTeam = info.MaxTeam;
                roundDb.CriteriaSetId = info.CriteriaSetID;

                _uow.Round.Update(roundDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteRoundAsync(string roundID)
        {
            try
            {
                Round result = await _uow.Round.GetFirstOrDefaultAsync(e => e.RoundId.Equals(roundID));
                if (result == null) return false;

                result.IsActive = false;
                _uow.Round.Update(result);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<RoundMenuAPIViewModel>> GetActiveMenuAsync()
        {
            try
            {

                List<Round> rounds = await _uow.Round.GetAllAsync(q => q.IsActive == true);


                List<Track> tracks = await _uow.Track.GetAllAsync(q => q.IsActive == true);


                List<RoundMenuAPIViewModel> result = rounds.Select(r => new RoundMenuAPIViewModel
                {

                    RoundId = r.RoundId,
                    RoundName = r.RoundName,


                    Tracks = tracks.Select(t => new TrackMenuAPIViewModel
                    {
                        TrackId = t.TrackId,
                        TrackName = t.TrackName
                    }).ToList()
                }).ToList();

                return result;
            }
            catch (Exception ex)
            {
                return new List<RoundMenuAPIViewModel>();
            }
        }

        public async Task<(bool IsSuccess, string Message)> AutoTransitionRoundAsync(string currentRoundId)
        {
            try
            {
                Round currentRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == currentRoundId);
                if (currentRound == null) return (false, "Current round not found.");

                Event eventInfo = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == currentRound.EventId);
                if (eventInfo == null) return (false, "Related event not found.");

                int nextIndex = currentRound.RoundIndex + 1;
                Round nextRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == currentRound.EventId && r.RoundIndex == nextIndex);

                if (nextRound == null) return (false, "This is the final round, cannot transition.");

                int topN = currentRound.TopNpromotion;
                if (topN <= 0) return (false, "TopNPromotion has not been set up for this round.");

                List<LeaderBoard> leaderboards = await _uow.LeaderBoard.GetAllAsync(lb => lb.RoundId == currentRoundId);

                foreach (LeaderBoard lb in leaderboards)
                {
                    List<LeaderBoardDetail> details = await _uow.LeaderBoardDetail.GetAllQueryable()
                        .Where(d => d.LeaderBoardId == lb.Id)
                        .OrderByDescending(d => d.Score)
                        .ToListAsync();

                    if (details.Count > topN)
                    {

                        LeaderBoardDetail lastPromoted = details[topN - 1];
                        LeaderBoardDetail firstEliminated = details[topN];

                        if (lastPromoted.Score == firstEliminated.Score)
                        {
                            return (false, $"Tie score detected at the Top {topN} boundary in Track {lb.TrackId}. Please resolve appeals before finalizing the leaderboard!");
                        }
                    }


                    List<LeaderBoardDetail> winningDetails = details.Take(topN).ToList();


                    foreach (LeaderBoardDetail detail in winningDetails)
                    {
                        TeamInRound oldTeamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(t => t.Id == detail.TeamInRoundId);
                        if (oldTeamInRound != null)
                        {
                            TeamInRound newTeam = new TeamInRound
                            {
                                Id = Guid.NewGuid().ToString(),
                                TeamId = oldTeamInRound.TeamId,
                                TrackId = oldTeamInRound.TrackId,
                                RoundId = nextRound.RoundId,
                                TopicId = oldTeamInRound.TopicId,
                                IsBanned = false,
                                IsCheck = false
                            };
                            await _uow.TeamInRound.AddAsync(newTeam);
                        }
                    }
                }

                currentRound.IsActive = false;
                nextRound.IsActive = true;
                eventInfo.CurrentRound = nextRound.RoundIndex;

                _uow.Round.Update(currentRound);
                _uow.Round.Update(nextRound);
                _uow.Event.Update(eventInfo);

                await _uow.SaveAsync();

                return (true, $"Round transition successful! Finalized the list of the top {topN} teams advancing to {nextRound.RoundName}.");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

       
    }
}
