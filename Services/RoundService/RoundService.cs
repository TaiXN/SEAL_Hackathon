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

        private static bool IsEventUnpublished(Event eventInfo)
        {
            return eventInfo.IsActive &&
                   eventInfo.CurrentRound == -1;
        }

        private static bool IsValidRoundTimeline(
            DateTime startDate,
            DateTime endDate,
            DateTime scoringStartDate,
            DateTime scoringEndDate)
        {
            return startDate < endDate
                && endDate <= scoringStartDate
                && scoringStartDate < scoringEndDate;
        }

        public async Task<bool> CreateRoundAsync(CreateRoundAPIViewModel info, string accID)
        {
            try
            {
                if (info == null ||
                    string.IsNullOrWhiteSpace(info.EventID) ||
                    string.IsNullOrWhiteSpace(info.RoundName) ||
                    string.IsNullOrWhiteSpace(info.CriteriaSetID))
                {
                    return false;
                }

                Event currentEvent =
                    await _uow.Event.GetFirstOrDefaultAsync(e =>
                        e.EventId == info.EventID &&
                        e.IsActive);

                if (currentEvent == null)
                {
                    return false;
                }

                if (!IsEventUnpublished(currentEvent))
                {
                    return false;
                }

                string normalizedRoundName = info.RoundName.Trim();

                if (info.MinTeam <= 0 ||
                    info.MaxTeam <= 0 ||
                    info.MinTeam > info.MaxTeam)
                {
                    return false;
                }

                if (info.TopNPromotion < 0 ||
                    info.TopNPromotion > info.MaxTeam)
                {
                    return false;
                }

                DateTime vnNow = DateTime.UtcNow.AddHours(7);

                DateTime startDateVn =
                    info.StartDate.ToUniversalTime().AddHours(7);

                DateTime endDateVn =
                    info.EndDate.ToUniversalTime().AddHours(7);

                DateTime scoringStartDateVn =
                    info.ScoringStartDate.ToUniversalTime().AddHours(7);

                DateTime scoringEndDateVn =
                    info.ScoringEndDate.ToUniversalTime().AddHours(7);

                if (startDateVn < vnNow)
                {
                    return false;
                }


                if (!IsValidRoundTimeline(
                        startDateVn,
                        endDateVn,
                        scoringStartDateVn,
                        scoringEndDateVn))
                {
                    return false;
                }

                CriteriaSet targetSet =
                    await _uow.CriteriaSet.GetFirstOrDefaultAsync(c =>
                        c.CriteriaSetId == info.CriteriaSetID &&
                        c.IsActive);

                if (targetSet == null)
                {
                    return false;
                }

                string normalizedNameLower =
                    normalizedRoundName.ToLower();

                Round duplicateName =
                    await _uow.Round.GetFirstOrDefaultAsync(r =>
                        r.EventId == info.EventID &&
                        r.IsActive &&
                        r.RoundName.ToLower() == normalizedNameLower);

                if (duplicateName != null)
                {
                    return false;
                }

                List<Round> activeRounds =
                    await _uow.Round.GetAllQueryable()
                        .Where(r =>
                            r.EventId == info.EventID &&
                            r.IsActive)
                        .OrderBy(r => r.RoundIndex)
                        .ToListAsync();

                Round previousRound = activeRounds.LastOrDefault();

                if (previousRound != null)
                {
                    if (!previousRound.ScoringEndDate.HasValue)
                    {
                        return false;
                    }

 
                    if (startDateVn <
                        previousRound.ScoringEndDate.Value)
                    {
                        return false;
                    }
                }


                List<Round> allEventRounds =
                    await _uow.Round.GetAllQueryable()
                        .Where(r => r.EventId == info.EventID)
                        .ToListAsync();

                int roundIndex = allEventRounds.Count == 0
                    ? 1
                    : allEventRounds.Max(r => r.RoundIndex) + 1;

                Round newRound = new Round
                {
                    RoundId = Guid.NewGuid().ToString(),
                    EventId = info.EventID,
                    Creator = accID,

                    RoundName = normalizedRoundName,
                    RoundIndex = roundIndex,

                    StartDate = startDateVn,
                    EndDate = endDateVn,

                    ScoringStartDate = scoringStartDateVn,
                    ScoringEndDate = scoringEndDateVn,

                    MinTeam = info.MinTeam,
                    MaxTeam = info.MaxTeam,
                    TopNpromotion = info.TopNPromotion,

                    CriteriaSetId = info.CriteriaSetID,
                    IsActive = true
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
                    CriteriaSetId = r.CriteriaSetId,
                    ScoringStartDate = r.ScoringStartDate,
                    ScoringEndDate = r.ScoringEndDate,
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
                    CriteriaSetId = r.CriteriaSetId,
                    ScoringStartDate = r.ScoringStartDate,
                    ScoringEndDate = r.ScoringEndDate,
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
                    CriteriaSetId = r.CriteriaSetId,
                    ScoringStartDate = r.ScoringStartDate,
                    ScoringEndDate = r.ScoringEndDate,
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
                if (info == null ||
                    string.IsNullOrWhiteSpace(info.RoundID) ||
                    string.IsNullOrWhiteSpace(info.EventID) ||
                    string.IsNullOrWhiteSpace(info.RoundName) ||
                    string.IsNullOrWhiteSpace(info.CriteriaSetID))
                {
                    return false;
                }

                Round roundDb =
                    await _uow.Round.GetFirstOrDefaultAsync(r =>
                        r.RoundId == info.RoundID &&
                        r.IsActive);

                if (roundDb == null)
                {
                    return false;
                }

                if (roundDb.EventId != info.EventID)
                {
                    return false;
                }

                Event currentEvent =
                    await _uow.Event.GetFirstOrDefaultAsync(e =>
                        e.EventId == roundDb.EventId &&
                        e.IsActive);

                if (currentEvent == null)
                {
                    return false;
                }

                if (!IsEventUnpublished(currentEvent))
                {
                    return false;
                }

                string normalizedRoundName = info.RoundName.Trim();

                if (info.MinTeam <= 0 ||
                    info.MaxTeam <= 0 ||
                    info.MinTeam > info.MaxTeam)
                {
                    return false;
                }

                if (info.TopNPromotion < 0 ||
                    info.TopNPromotion > info.MaxTeam)
                {
                    return false;
                }

                DateTime vnNow = DateTime.UtcNow.AddHours(7);

                DateTime startDateVn =
                    info.StartDate.ToUniversalTime().AddHours(7);

                DateTime endDateVn =
                    info.EndDate.ToUniversalTime().AddHours(7);

                DateTime scoringStartDateVn =
                    info.ScoringStartDate.ToUniversalTime().AddHours(7);

                DateTime scoringEndDateVn =
                    info.ScoringEndDate.ToUniversalTime().AddHours(7);

                if (startDateVn < vnNow)
                {
                    return false;
                }

                if (!IsValidRoundTimeline(
                        startDateVn,
                        endDateVn,
                        scoringStartDateVn,
                        scoringEndDateVn))
                {
                    return false;
                }

                CriteriaSet targetSet =
                    await _uow.CriteriaSet.GetFirstOrDefaultAsync(c =>
                        c.CriteriaSetId == info.CriteriaSetID &&
                        c.IsActive);

                if (targetSet == null)
                {
                    return false;
                }

                string normalizedNameLower =
                    normalizedRoundName.ToLower();


                Round duplicateName =
                    await _uow.Round.GetFirstOrDefaultAsync(r =>
                        r.EventId == roundDb.EventId &&
                        r.RoundId != roundDb.RoundId &&
                        r.IsActive &&
                        r.RoundName.ToLower() == normalizedNameLower);

                if (duplicateName != null)
                {
                    return false;
                }

                Round previousRound = await _uow.Round.GetAllQueryable()
                        .FirstOrDefaultAsync(r =>
                            r.EventId == roundDb.EventId &&
                            r.RoundIndex == roundDb.RoundIndex - 1 &&
                            r.IsActive);

                Round nextRound = await _uow.Round.GetAllQueryable()
                        .FirstOrDefaultAsync(r =>
                            r.EventId == roundDb.EventId &&
                            r.RoundIndex == roundDb.RoundIndex + 1 &&
                            r.IsActive);

                if (previousRound != null)
                {
                    if (!previousRound.ScoringEndDate.HasValue)
                    {
                        return false;
                    }

                    if (startDateVn <
                        previousRound.ScoringEndDate.Value)
                    {
                        return false;
                    }
                }

                if (nextRound != null &&
                    scoringEndDateVn > nextRound.StartDate)
                {
                    return false;
                }

                roundDb.RoundName = normalizedRoundName;

                roundDb.StartDate = startDateVn;
                roundDb.EndDate = endDateVn;

                roundDb.ScoringStartDate = scoringStartDateVn;
                roundDb.ScoringEndDate = scoringEndDateVn;

                roundDb.MinTeam = info.MinTeam;
                roundDb.MaxTeam = info.MaxTeam;
                roundDb.TopNpromotion = info.TopNPromotion;

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
                Round currentRound = await _uow.Round.GetFirstOrDefaultAsync(
                    r => r.RoundId == currentRoundId
                );

                if (currentRound == null)
                {
                    return (false, "Current round not found.");
                }

                if (!currentRound.IsActive)
                {
                    return (false, "This round has already been finalized.");
                }

                Event eventInfo = await _uow.Event.GetFirstOrDefaultAsync(
                    e => e.EventId == currentRound.EventId
                );

                if (eventInfo == null)
                {
                    return (false, "Related event not found.");
                }


                DateTime vnNow = DateTime.UtcNow.AddHours(7);

                if (!currentRound.ScoringEndDate.HasValue)
                {
                    return (
                        false,
                        "Scoring end date has not been configured."
                    );
                }

                if (vnNow < currentRound.ScoringEndDate.Value)
                {
                    return (
                        false,
                        $"Scoring period has not ended yet. " +
                        $"It ends at {currentRound.ScoringEndDate.Value:dd/MM/yyyy HH:mm}."
                    );
                }


                int nextIndex = currentRound.RoundIndex + 1;

                Round nextRound = await _uow.Round.GetFirstOrDefaultAsync(
                    r =>
                        r.EventId == currentRound.EventId &&
                        r.RoundIndex == nextIndex
                );

                if (nextRound == null)
                {
                    List<Prize> eventPrizes = await _uow.Prize
                        .GetAllQueryable()
                        .Where(p =>
                            p.EventId == eventInfo.EventId &&
                            p.IsActive)
                        .OrderBy(p => p.RankIndex)
                        .ToListAsync();

                    if (!eventPrizes.Any())
                    {
                        return (
                            false,
                            "No prizes have been configured for this event."
                        );
                    }

                    if (eventPrizes.Any(p =>
                        !string.IsNullOrEmpty(p.TeamId)))
                    {
                        return (
                            false,
                            "Prizes for this event have already been assigned."
                        );
                    }

                    List<LeaderBoard> leaderboards =
                        await _uow.LeaderBoard.GetAllAsync(
                            lb => lb.RoundId == currentRoundId
                        );

                    if (!leaderboards.Any())
                    {
                        return (
                            false,
                            "Final round leaderboard not found."
                        );
                    }

                    List<(string TeamId, double Score)> rankedTeams =
                        new List<(string TeamId, double Score)>();


                    foreach (LeaderBoard lb in leaderboards)
                    {
                        List<LeaderBoardDetail> details =
                            await _uow.LeaderBoardDetail
                                .GetAllQueryable()
                                .Where(d =>
                                    d.LeaderBoardId == lb.Id)
                                .ToListAsync();


                        foreach (LeaderBoardDetail detail in details)
                        {
                            TeamInRound teamInRound =
                                await _uow.TeamInRound
                                    .GetFirstOrDefaultAsync(
                                        t =>
                                            t.Id == detail.TeamInRoundId &&
                                            t.RoundId == currentRoundId &&
                                            !t.IsBanned
                                    );


                            if (teamInRound == null)
                            {
                                continue;
                            }


                            rankedTeams.Add(
                                (
                                    teamInRound.TeamId,
                                    detail.Score
                                )
                            );
                        }
                    }


                    if (!rankedTeams.Any())
                    {
                        return (
                            false,
                            "No eligible teams found in the final round."
                        );
                    }


                    rankedTeams = rankedTeams
                        .GroupBy(x => x.TeamId)
                        .Select(g =>
                            g.OrderByDescending(x => x.Score)
                             .First())
                        .OrderByDescending(x => x.Score)
                        .ToList();


                    int maxPrizeRank = eventPrizes
                        .Where(p => p.RankIndex > 0)
                        .Select(p => p.RankIndex)
                        .DefaultIfEmpty(0)
                        .Max();


                    if (maxPrizeRank <= 0)
                    {
                        return (
                            false,
                            "Prize RankIndex configuration is invalid."
                        );
                    }


                    int numberOfRanksToCheck =
                        Math.Min(
                            maxPrizeRank,
                            rankedTeams.Count
                        );


                    for (int i = 0;
                         i < numberOfRanksToCheck - 1;
                         i++)
                    {
                        if (rankedTeams[i].Score ==
                            rankedTeams[i + 1].Score)
                        {
                            return (
                                false,
                                $"Tie score detected between Rank #{i + 1} " +
                                $"and Rank #{i + 2}. " +
                                $"Please resolve the tie before finalizing prizes."
                            );
                        }
                    }

                    if (rankedTeams.Count > maxPrizeRank &&
                        maxPrizeRank > 0)
                    {
                        double lastWinningScore =
                            rankedTeams[maxPrizeRank - 1].Score;

                        double firstNonWinningScore =
                            rankedTeams[maxPrizeRank].Score;


                        if (lastWinningScore ==
                            firstNonWinningScore)
                        {
                            return (
                                false,
                                $"Tie score detected at the prize boundary Rank #{maxPrizeRank}. " +
                                $"Please resolve the tie before finalizing prizes."
                            );
                        }
                    }
                    foreach (Prize prize in eventPrizes)
                    {
                        int rank = prize.RankIndex;

                        if (rank <= 0)
                        {
                            continue;
                        }


                        int index = rank - 1;


                        if (index >= rankedTeams.Count)
                        {
                            continue;
                        }


                        prize.TeamId =
                            rankedTeams[index].TeamId;


                        _uow.Prize.Update(prize);
                    }

                    currentRound.IsActive = false;

                    _uow.Round.Update(currentRound);

                    await _uow.SaveAsync();


                    return (
                        true,
                        "Final round completed. Rankings were finalized and prizes were automatically assigned."
                    );
                }


                int topN = currentRound.TopNpromotion;

                if (topN <= 0)
                {
                    return (
                        false,
                        "TopNPromotion has not been set up for this round."
                    );
                }


                List<LeaderBoard> currentLeaderboards =
                    await _uow.LeaderBoard.GetAllAsync(
                        lb => lb.RoundId == currentRoundId
                    );


                if (!currentLeaderboards.Any())
                {
                    return (
                        false,
                        "Leaderboard for this round was not found."
                    );
                }


                foreach (LeaderBoard lb in currentLeaderboards)
                {
                    List<LeaderBoardDetail> details =
                        await _uow.LeaderBoardDetail
                            .GetAllQueryable()
                            .Where(d =>
                                d.LeaderBoardId == lb.Id)
                            .OrderByDescending(d => d.Score)
                            .ToListAsync();

                    if (details.Count < topN)
                    {
                        return (
                            false,
                            $"Track {lb.TrackId} does not have enough ranked teams. " +
                            $"Required Top {topN}, currently available: {details.Count}."
                        );
                    }

                    if (details.Count > topN)
                    {
                        LeaderBoardDetail lastPromoted =
                            details[topN - 1];

                        LeaderBoardDetail firstEliminated =
                            details[topN];


                        if (lastPromoted.Score ==
                            firstEliminated.Score)
                        {
                            return (
                                false,
                                $"Tie score detected at the Top {topN} boundary " +
                                $"in Track {lb.TrackId}. " +
                                $"Please resolve appeals before finalizing the leaderboard!"
                            );
                        }
                    }

                    List<LeaderBoardDetail> winningDetails =
                        details
                            .Take(topN)
                            .ToList();

                    foreach (LeaderBoardDetail detail
                             in winningDetails)
                    {
                        TeamInRound oldTeamInRound =
                            await _uow.TeamInRound
                                .GetFirstOrDefaultAsync(
                                    t =>
                                        t.Id ==
                                        detail.TeamInRoundId
                                );


                        if (oldTeamInRound == null)
                        {
                            continue;
                        }

                        TeamInRound existingNextRoundTeam =
                            await _uow.TeamInRound
                                .GetFirstOrDefaultAsync(
                                    t =>
                                        t.TeamId ==
                                        oldTeamInRound.TeamId &&
                                        t.RoundId ==
                                        nextRound.RoundId
                                );


                        if (existingNextRoundTeam != null)
                        {
                            continue;
                        }


                        TeamInRound newTeam =
                            new TeamInRound
                            {
                                Id = Guid.NewGuid().ToString(),

                                TeamId =
                                    oldTeamInRound.TeamId,

                                TrackId =
                                    oldTeamInRound.TrackId,

                                RoundId =
                                    nextRound.RoundId,

                                TopicId =
                                    oldTeamInRound.TopicId,

                                IsBanned = false,

                                IsCheck = false
                            };


                        await _uow.TeamInRound
                            .AddAsync(newTeam);
                    }
                }

                currentRound.IsActive = false;
                nextRound.IsActive = true;

                eventInfo.CurrentRound =
                    nextRound.RoundIndex;


                _uow.Round.Update(currentRound);
                _uow.Round.Update(nextRound);
                _uow.Event.Update(eventInfo);


                await _uow.SaveAsync();


                return (
                    true,
                    $"Round transition successful! " +
                    $"Finalized the list of the top {topN} teams advancing to {nextRound.RoundName}."
                );
            }
            catch (Exception ex)
            {
                return (
                    false,
                    $"System error: {ex.Message}"
                );
            }
        }

    }
}
