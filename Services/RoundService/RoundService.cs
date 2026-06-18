using APIViewModels.Round;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;

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
                if (info.StartDate >= info.EndDate)
                {
                    return false;
                }

                if (info.StartDate < DateTime.Now)
                {
                    return false;
                }
  
                Event targetEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == info.EventID && e.IsActive);
                if (targetEvent == null) return false;
         
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
                    StartDate = info.StartDate,
                    EndDate = info.EndDate,
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

        public async Task<List<Round>> GetAllRoundsAsync()
        {
            try
            {
               List<Round> result = await _uow.Round.GetAllAsync();
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

        public async Task<bool> UpdateRoundAsync(UpdateRoundAPIViewModel info)
        {
            try
            {
                Round roundDb = await _uow.Round.GetFirstOrDefaultAsync(q => q.RoundId.Equals(info.RoundID));
                if (roundDb == null)
                {
                    return false;
                }

                if (info.StartDate >= info.EndDate)
                {
                    return false;
                }

                if (info.StartDate < DateTime.Now)
                {
                    return false;
                }

                roundDb.EventId = info.EventID;
                roundDb.RoundName = info.RoundName;
                roundDb.StartDate = info.StartDate;
                roundDb.EndDate = info.EndDate;
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
                var result = await _uow.Round.GetFirstOrDefaultAsync(e => e.RoundId.Equals(roundID));
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

    }
}
