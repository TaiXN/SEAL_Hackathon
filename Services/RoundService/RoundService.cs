using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.RoundService
{
    public class RoundService : IRoundService
    {
        private readonly IUnitOfWork _uow;

        public RoundService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateRoundAsync(Round newRound)
        {
            try
            {
                await _uow.Round.AddAsync(newRound);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<List<Round>> GetAllRoundsAsync()
        {
            try
            {
                var result = await _uow.Round.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Round>();
            }
        }

        public async Task<Round> GetRoundByIdAsync(string roundID)
        {
            try
            {
                return await _uow.Round.GetFirstOrDefaultAsync(e => e.RoundId == roundID);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateRoundAsync(Round roundToUpdate)
        {
            try
            {
                _uow.Round.Update(roundToUpdate);
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
                var round = await _uow.Round.GetFirstOrDefaultAsync(e => e.RoundId.Equals(roundID));

                if (round == null) return false;

                round.IsActive = false;

                _uow.Round.Update(round);
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
