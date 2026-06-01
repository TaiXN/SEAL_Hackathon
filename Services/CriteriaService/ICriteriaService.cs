using APIViewModels.Criteria;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.CriteriaService
{
    public interface ICriteriaService
    {
        Task<bool> CreateCriteriaAsync(CreateCriteriaAPIViewModel info);
        Task<List<Criterion>> GetAllCriteriaAsync();
        Task<List<Criterion>> GetAllCriteriaAsyncByRoundID(string roundID);
        Task<Criterion> GetCriteriaByIdAsync(string criteriaID);
        Task<bool> UpdateCriteriaAsync(string id, UpdateCriteriaAPIViewModel info);
        Task<bool> DeleteCriteriaAsync(string criteriaID);

    }
}
