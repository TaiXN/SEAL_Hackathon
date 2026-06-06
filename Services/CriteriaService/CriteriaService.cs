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


        public async Task<bool> CreateTemplateWithMappingsAsync(CreateTemplateAPIViewModel info)
        {
            try
            {
                CriteriaTemplate duplicateTemplate = await _uow.CriteriaTemplate.GetFirstOrDefaultAsync(e => e.TemplateName.ToLower() == info.TemplateName.ToLower() && e.IsActive);
                if (duplicateTemplate != null) return false;

                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Criterion checkCriterion = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == item.CriteriaId && e.IsActive);

                    if (checkCriterion == null)
                    {
                        return false;
                    }
                }

                CriteriaTemplate newTemplate = new CriteriaTemplate()
                {
                    CriteriaTemplateId = Guid.NewGuid().ToString(),
                    TemplateName = info.TemplateName,
                    IsDefault = info.IsDefault,
                    IsActive = true
                };

                await _uow.CriteriaTemplate.AddAsync(newTemplate);

                List<Mapping> mappings = new List<Mapping>();

                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Mapping newMapping = new Mapping()
                    {
                        CriteriaTemplateId = newTemplate.CriteriaTemplateId,
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


        public async Task<List<CriteriaTemplate>> GetAllTemplatesAsync()
        {
            try
            {
                List<CriteriaTemplate> result = await _uow.CriteriaTemplate.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<CriteriaTemplate>();
            }
        }


        public async Task<List<Mapping>> GetTemplateDetailsAsync(string templateId)
        {
            try
            {
                List<Mapping> result = await _uow.Mapping.GetAllAsync(e => e.CriteriaTemplateId == templateId);
                return result.ToList();
            }
            catch (Exception ex)
            {
                return new List<Mapping>();
            }
        }


        public async Task<bool> UpdateTemplateAsync(string templateId, UpdateTemplateAPIViewModel info)
        {
            try
            {
                CriteriaTemplate templateDb = await _uow.CriteriaTemplate.GetFirstOrDefaultAsync(e => e.CriteriaTemplateId == templateId && e.IsActive);
                if (templateDb == null) return false;

                CriteriaTemplate duplicateTemplate = await _uow.CriteriaTemplate.GetFirstOrDefaultAsync(e => e.TemplateName.ToLower() == info.TemplateName.ToLower() && e.IsActive);

                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Criterion checkCriterion = await _uow.Criteria.GetFirstOrDefaultAsync(e => e.CriteriaId == item.CriteriaId && e.IsActive);
                    if (checkCriterion == null) return false;
                }

                if (duplicateTemplate != null) return false;

                templateDb.TemplateName = info.TemplateName;
                templateDb.IsDefault = info.IsDefault;
                _uow.CriteriaTemplate.Update(templateDb);


                List<Mapping> oldMappings = await _uow.Mapping.GetAllAsync(e => e.CriteriaTemplateId == templateId);


                foreach (Mapping oldMapping in oldMappings)
                {
                    _uow.Mapping.Remove(oldMapping);
                }


                List<Mapping> newMappings = new List<Mapping>();
                foreach (CriteriaMappingItemViewModel item in info.CriteriaList)
                {
                    Mapping newMapping = new Mapping()
                    {
                        CriteriaTemplateId = templateId,
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

        public async Task<bool> DeleteTemplateAsync(string templateId)
        {
            try
            {
                CriteriaTemplate templateDb = await _uow.CriteriaTemplate.GetFirstOrDefaultAsync(t => t.CriteriaTemplateId == templateId);
                if (templateDb == null) return false;

                templateDb.IsActive = false;

                _uow.CriteriaTemplate.Update(templateDb);
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
