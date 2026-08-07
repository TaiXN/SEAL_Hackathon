using APIViewModels.Prize;
using Azure.Core;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;

namespace Services.PrizeService
{
    public class PrizeService : IPrizeService
    {
        private readonly IUnitOfWork _uow;
        public PrizeService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<(bool IsSuccess, string Message)>CreatePrizeAsync(CreatePrizeAPIViewModel request)
        {
            try
            {
                if (request == null ||
                    string.IsNullOrWhiteSpace(request.PrizeName) ||
                    string.IsNullOrWhiteSpace(request.EventId))
                {
                    return (
                        false,
                        "Prize Name and EventId cannot be empty!"
                    );
                }


                if (request.RankIndex <= 0)
                {
                    return (
                        false,
                        "Prize RankIndex must be greater than 0."
                    );
                }


                Event existingEvent =
                    await _uow.Event.GetFirstOrDefaultAsync(
                        e => e.EventId == request.EventId
                    );


                if (existingEvent == null)
                {
                    return (
                        false,
                        "Event does not exist in the system!"
                    );
                }


                Prize duplicateRank =
                    await _uow.Prize.GetFirstOrDefaultAsync(
                        p =>
                            p.EventId == request.EventId &&
                            p.RankIndex == request.RankIndex &&
                            p.IsActive
                    );


                if (duplicateRank != null)
                {
                    return (
                        false,
                        $"Rank #{request.RankIndex} already has a prize."
                    );
                }


                Prize newPrize = new Prize
                {
                    PrizeId = Guid.NewGuid().ToString(),
                    PrizeName = request.PrizeName.Trim(),
                    Description = request.Description,
                    EventId = request.EventId,
                    IsActive = true,
                    TeamId = null,
                    RankIndex = request.RankIndex
                };


                await _uow.Prize.AddAsync(newPrize);

                await _uow.SaveAsync();


                return (
                    true,
                    "Prize created successfully!"
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

        public async Task<List<PrizeAPIViewModel>> GetAllPrizesAsync()
        {
            try
            {
                List<Prize> result = await _uow.Prize.GetAllAsync();

                return result.Select(p => new PrizeAPIViewModel
                {
                    PrizeId = p.PrizeId,
                    PrizeName = p.PrizeName,
                    Description = p.Description,
                    EventId = p.EventId,
                    TeamId = p.TeamId,
                    IsActive = p.IsActive,
                    RankIndex = p.RankIndex
                }).ToList();
            }
            catch
            {
                return new List<PrizeAPIViewModel>();
            }
        }

        public async Task<PrizeAPIViewModel> GetPrizeByIdAsync(string prizeId)
        {
            try
            {
                Prize p = await _uow.Prize.GetFirstOrDefaultAsync(e => e.PrizeId == prizeId);
                if (p == null) return null;

                return new PrizeAPIViewModel
                {
                    PrizeId = p.PrizeId,
                    PrizeName = p.PrizeName,
                    Description = p.Description,
                    EventId = p.EventId,
                    TeamId = p.TeamId,
                    IsActive = p.IsActive,
                    RankIndex = p.RankIndex
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<PrizeAPIViewModel>> GetPrizesByEventNameAsync(string eventName)
        {
            try
            {
                List<string> matchedEventIds = await _uow.Event.GetAllQueryable()
                    .Where(e => e.EventName.Contains(eventName))
                    .Select(e => e.EventId)
                    .ToListAsync();

                List<Prize> result = await _uow.Prize.GetAllQueryable()
                    .Where(p => matchedEventIds.Contains(p.EventId))
                    .ToListAsync();

                return result.Select(p => new PrizeAPIViewModel
                {
                    PrizeId = p.PrizeId,
                    PrizeName = p.PrizeName,
                    Description = p.Description,
                    EventId = p.EventId,
                    TeamId = p.TeamId,
                    IsActive = p.IsActive,
                    RankIndex = p.RankIndex
                }).ToList();
            }
            catch (Exception ex)
            {
                return new List<PrizeAPIViewModel>();
            }
        }

        public async Task<(bool IsSuccess, string Message)> UpdatePrizeAsync(string prizeId, UpdatePrizeAPIViewModel request)
        {
            try
            {
                if (string.IsNullOrEmpty(prizeId) || request == null)
                {
                    return (false, "Invalid input data.");
                }

                Prize existingPrize = await _uow.Prize.GetFirstOrDefaultAsync(p => p.PrizeId == prizeId);

                if (existingPrize == null)
                {
                    return (false, "Prize not found.");
                }

                existingPrize.PrizeName = request.PrizeName;
                existingPrize.Description = request.Description;

                _uow.Prize.Update(existingPrize);
                await _uow.SaveAsync();

                return (true, "Prize updated successfully!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<(bool IsSuccess, string Message)> DeletePrizeAsync(string prizeId)
        {
            try
            {
                Prize existingPrize = await _uow.Prize.GetFirstOrDefaultAsync(p => p.PrizeId == prizeId);

                if (existingPrize == null)
                {
                    return (false, "Prize not found.");
                }

                existingPrize.IsActive = false;

                _uow.Prize.Update(existingPrize);
                await _uow.SaveAsync();

                return (true, "Prize deleted successfully!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<(bool IsSuccess, string Message)> ReActivePrizeAsync(string prizeId)
        {
            try
            {
                Prize existingPrize = await _uow.Prize.GetFirstOrDefaultAsync(p => p.PrizeId == prizeId);

                if (existingPrize == null)
                {
                    return (false, "Prize not found.");
                }

                if (existingPrize.IsActive == true)
                {
                    return (false, "Prize is already active.");
                }

                existingPrize.IsActive = true;

                _uow.Prize.Update(existingPrize);
                await _uow.SaveAsync();

                return (true, "Prize reactivated successfully!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<(bool IsSuccess, string Message)> ManualAssignPrizeAsync(PrizeAPIViewModel request)
        {
            try
            {
             
                if (request == null || string.IsNullOrEmpty(request.PrizeId) || string.IsNullOrEmpty(request.TeamId))
                {
                    return (false, "Missing PrizeId or TeamId.");
                }

             
                Prize prize = await _uow.Prize.GetFirstOrDefaultAsync(p => p.PrizeId == request.PrizeId);

                if (prize == null)
                {
                    return (false, "Prize not found.");
                }

            
                if (prize.TeamId != null)
                {
                    return (false, "This prize has already been awarded to another team. Please remove the current assignment before reassigning.");
                }

           
                Team team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == request.TeamId);

                if (team == null)
                {
                    return (false, "Team not found.");
                }

            
                prize.TeamId = request.TeamId;

                _uow.Prize.Update(prize);
                await _uow.SaveAsync();

                return (true, $"Successfully awarded '{prize.PrizeName}' to team '{team.TeamName}'!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<List<PrizeAPIViewModel>> GetTeamAwardsAsync(string eventId, string teamId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(eventId) ||
                    string.IsNullOrWhiteSpace(teamId))
                {
                    return new List<PrizeAPIViewModel>();
                }


                List<Prize> prizes =
                    await _uow.Prize.GetAllAsync(
                        p =>
                            p.EventId == eventId &&
                            p.TeamId == teamId &&
                            p.IsActive
                    );


                return prizes
                    .OrderBy(p => p.RankIndex)
                    .Select(p => new PrizeAPIViewModel
                    {
                        PrizeId = p.PrizeId,
                        PrizeName = p.PrizeName,
                        Description = p.Description,
                        EventId = p.EventId,
                        TeamId = p.TeamId,
                        RankIndex = p.RankIndex,
                        IsActive = p.IsActive
                    })
                    .ToList();
            }
            catch
            {
                return new List<PrizeAPIViewModel>();
            }
        }

    }
}
