using APIViewModels.Evaluation;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.EvaluationService
{
    public interface IEvaluationService
    {
        Task<bool> CreateEvaluateAsync(string teacherId, EvaluationAPIViewModel info);
        Task<List<Evaluation>> GetAllEventsAsync();
        Task<Evaluation> GetEvaluationByIdAsync(string evaluationID);
        Task<bool> UpdateEvaluationAsync(string teacherId, UpdateEvaluationAPIViewModel info);
        Task<bool> DeleteEvaluationAsync(string evaluationID);
       
    }
}
