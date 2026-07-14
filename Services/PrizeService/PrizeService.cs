using APIViewModels.Prize;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;
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

        public async Task<(bool IsSuccess, string Message)> CreatePrizeAsync(CreatePrizeAPIViewModel request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.PrizeName) || string.IsNullOrEmpty(request.EventId))
                {
                    return (false, "Prize Name and EventId cannot be empty!");
                }

                Event existingEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == request.EventId);

                if (existingEvent == null)
                {
                    return (false, "Event does not exist in the system!");
                }

                Prize newPrize = new Prize
                {
                    PrizeId = Guid.NewGuid().ToString(),
                    PrizeName = request.PrizeName,
                    Description = request.Description,
                    EventId = request.EventId,
                    IsActive = true,
                    TeamId = null
                };

                await _uow.Prize.AddAsync(newPrize);
                await _uow.SaveAsync();

                return (true, "Prize created successfully!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<List<Prize>> GetAllPrizesAsync()
        {
            try
            {
                List<Prize> result = await _uow.Prize.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Prize>();
            }
        }

        public async Task<Prize> GetPrizeByIdAsync(string prizeId)
        {
            try
            {
                return await _uow.Prize.GetFirstOrDefaultAsync(e => e.PrizeId == prizeId);
            }
            catch
            {
                return null;
            }
        }

        public async Task<List<Prize>> GetPrizesByEventIdAsync(string eventId)
        {
            try
            {
                List<Prize> result = await _uow.Prize.GetAllQueryable()
                    .Where(p => p.EventId == eventId)
                    .ToListAsync();

                return result;
            }
            catch (Exception ex)
            {
                return new List<Prize>();
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
    }
}
