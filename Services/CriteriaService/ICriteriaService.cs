using APIViewModels.Criteria;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.CriteriaService
{
    public interface ICriteriaService
    {
        Task<bool> CreateCriterionAsync(CreateCriterionAPIViewModel info);
        Task<List<Criterion>> GetAllCriterionsAsync();
        Task<Criterion> GetCriterionByIdAsync(string criterionID);
        Task<bool> UpdatCriterionAsync(string id, UpdateCriterionAPIViewModel info);
        Task<bool> DeleteCriterionAsync(string criterionID);
        Task<bool> ReActiveCriterionAsync(string criterionID);
        Task<bool> CreateTemplateWithMappingsAsync(CreateTemplateAPIViewModel info);
        Task<List<CriteriaTemplate>> GetAllTemplatesAsync();
        Task<List<Mapping>> GetTemplateDetailsAsync(string templateId);
        Task<bool> UpdateTemplateAsync(string templateId, UpdateTemplateAPIViewModel info);
        Task<bool> DeleteTemplateAsync(string templateId);

    }
}
