using APIViewModels.Criteria;
using APIViewModels.Event;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.CriteriaService
{
    public class CriteriaService : ICriteriaService
    {
        private readonly UnitOfWork _uow;
        public CriteriaService(UnitOfWork uow)
        {
            _uow = uow;
        }
        public async Task<bool> CreateCriteriaAsync(CreateCriteriaAPIViewModel info)
        {
            try
            {
                Criterion newCriteria = new Criterion()
                {
                    CriteriaId = Guid.NewGuid().ToString(),
                    CriteriaName = info.CriteriaName,
                    Score = info.Score,
                    RoundId = info.RoundID,
                    IsActive = true
                };
                await _uow.Criteria.AddAsync(newCriteria);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<Criterion>> GetAllCriteriaAsync()
        {
            try
            {
                var result = await _uow.Criteria.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Criterion>();
            }
        }

        public async Task<List<Criterion>> GetAllCriteriaAsyncByRoundID(string roundID)
        {
            try
            {
                var result = await _uow.Criteria.GetAllAsync(e => e.RoundId == roundID);
                return result.ToList();
            }
            catch(Exception ex)
            {
                return new List<Criterion>();
            }
        }

        public async Task<Criterion> GetCriteriaByIdAsync(string criteriaID)
        {
            try
            {
                return await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == criteriaID);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateCriteriaAsync(string id, UpdateCriteriaAPIViewModel info)
        {
            try
            {
                var criteriaDb = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == id);
                if (criteriaDb == null) return false;

                criteriaDb.CriteriaName = info.CriteriaName;
                criteriaDb.Score = info.Score;
                criteriaDb.RoundId = info.RoundID;

                _uow.Criteria.Update(criteriaDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteCriteriaAsync(string criteriaID)
        {
            try
            {
                var criteriaDb = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId.Equals(criteriaID));
                if (criteriaDb == null) return false;

                criteriaDb.IsActive = false;
                _uow.Criteria.Update(criteriaDb);
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
