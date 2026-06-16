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
        Task<bool> CreateSetWithMappingsAsync(CreateSetAPIViewModel info);
        Task<List<CriteriaSet>> GetAllSetsAsync();
        Task<List<Mapping>> GetSetDetailsAsync(string setID);
        Task<bool> UpdateSetAsync(string setID, UpdateSetAPIViewModel info);
        Task<bool> DeleteSetAsync(string setId);
    }
}
