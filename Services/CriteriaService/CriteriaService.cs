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
        private readonly IUnitOfWork _uow;
        public CriteriaService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateCriterionAsync(CreateCriterionAPIViewModel info)
        {
            try
            {
                Criterion criterion = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaName.ToLower() == info.CriteriaName.ToLower());

                if (criterion != null)
                {
                    return false;
                }

                Criterion newCriterion = new Criterion()
                {
                    CriteriaId = Guid.NewGuid().ToString(),
                    CriteriaName = info.CriteriaName,
                    Description = info.Description,
                    IsActive = true
                };
                await _uow.Criteria.AddAsync(newCriterion);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<Criterion>> GetAllCriterionsAsync()
        {
            try
            {
                List<Criterion> result = await _uow.Criteria.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Criterion>();
            }
        }

        public async Task<Criterion> GetCriterionByIdAsync(string criterionID)
        {
            try
            {
                return await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == criterionID && e.IsActive);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdatCriterionAsync(string id, UpdateCriterionAPIViewModel info)
        {
            try
            {
                Criterion criterionDb = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == id && e.IsActive);
                if (criterionDb == null) return false;

                Criterion duplicateCheck = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaName.ToLower() == info.CriteriaName.ToLower() && e.CriteriaId != id && e.IsActive);

                if (duplicateCheck != null)
                {
                    return false;
                }

                criterionDb.CriteriaName = info.CriteriaName;
                criterionDb.Description = info.Description;

                _uow.Criteria.Update(criterionDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteCriterionAsync(string criterionID)
        {
            try
            {
                Criterion result = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId.Equals(criterionID));
                if (result == null) return false;

                result.IsActive = false;
                _uow.Criteria.Update(result);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> ReActiveCriterionAsync(string criterionID)
        {
            try
            {
                Criterion result = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId.Equals(criterionID));
                if (result == null) return false;

                result.IsActive = true;
                _uow.Criteria.Update(result);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        public async Task<bool> CreateSetWithMappingsAsync(CreateSetAPIViewModel info)
        {
            try
            {
                CriteriaSet duplicateTemplate = await _uow.CriteriaSet.GetFirstOrDefaultAsync(e => e.SetName.ToLower() == info.SetName.ToLower() && e.IsActive);
                if (duplicateTemplate != null) return false;

                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Criterion checkCriterion = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == item.CriteriaId && e.IsActive);

                    if (checkCriterion == null)
                    {
                        return false;
                    }
                }

                CriteriaSet newSet = new CriteriaSet()
                {
                    CriteriaSetId = Guid.NewGuid().ToString(),
                    SetName = info.SetName,
                    IsDefault = info.IsDefault,
                    IsActive = true
                };

                await _uow.CriteriaSet.AddAsync(newSet);

                List<Mapping> mappings = new List<Mapping>();

                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Mapping newMapping = new Mapping()
                    {
                        CriteriaSetId = newSet.CriteriaSetId,
                        CriteriaId = item.CriteriaId,
                        Score = item.Score
                    };
                    mappings.Add(newMapping);
                }

                await _uow.Mapping.AddRangeAsync(mappings);

                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        public async Task<List<CriteriaSet>> GetAllSetsAsync()
        {
            try
            {
                List<CriteriaSet> result = await _uow.CriteriaSet.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<CriteriaSet>();
            }
        }


        public async Task<List<Mapping>> GetSetDetailsAsync(string setID)
        {
            try
            {
                List<Mapping> result = await _uow.Mapping.GetAllAsync(e => e.CriteriaSetId == setID);
                return result.ToList();
            }
            catch (Exception ex)
            {
                return new List<Mapping>();
            }
        }


        public async Task<bool> UpdateSetAsync(string setID, UpdateSetAPIViewModel info)
        {
            try
            {
                CriteriaSet setDb = await _uow.CriteriaSet.GetFirstOrDefaultAsync(e => e.CriteriaSetId == setID && e.IsActive);
                if (setDb == null) return false;

                CriteriaSet duplicateSet = await _uow.CriteriaSet.GetFirstOrDefaultAsync(e => e.SetName.ToLower() == info.SetName.ToLower() && e.IsActive);

                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Criterion checkCriterion = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == item.CriteriaId && e.IsActive);
                    if (checkCriterion == null) return false;
                }

                if (duplicateSet != null) return false;

                setDb.SetName = info.SetName;
                setDb.IsDefault = info.IsDefault;
                _uow.CriteriaSet.Update(setDb);


                List<Mapping> oldMappings = await _uow.Mapping.GetAllAsync(e => e.CriteriaSetId == setID);


                foreach (Mapping oldMapping in oldMappings)
                {
                    _uow.Mapping.Remove(oldMapping);
                }


                List<Mapping> newMappings = new List<Mapping>();
                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Mapping newMapping = new Mapping()
                    {
                        CriteriaSetId = setID,
                        CriteriaId = item.CriteriaId,
                        Score = item.Score
                    };
                    newMappings.Add(newMapping);
                }


                await _uow.Mapping.AddRangeAsync(newMappings);


                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteSetAsync(string setId)
        {
            try
            {
                CriteriaSet setDb = await _uow.CriteriaSet.GetFirstOrDefaultAsync(t => t.CriteriaSetId == setId);
                if (setDb == null) return false;

                setDb.IsActive = false;

                _uow.CriteriaSet.Update(setDb);
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
