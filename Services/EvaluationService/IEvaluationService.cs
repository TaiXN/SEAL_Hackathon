using APIViewModels.Evaluation;
using APIViewModels.Judge;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.EvaluationService
{
    public interface IEvaluationService
    {
        Task<bool> CreateEvaluateAsync(string teacherId, EvaluationAPIViewModel info);
        Task<List<EvaluationDetailAPIViewModel>> GetAllEvaluationsDetailedAsync();
        Task<List<EvaluationDetailAPIViewModel>> GetEvaluationsBySubmissionIdAsync(string submissionId);
        Task<Evaluation> GetEvaluationByIdAsync(string evaluationID);
        Task<bool> UpdateEvaluationAsync(string teacherId, UpdateEvaluationAPIViewModel info);
        Task<bool> DeleteEvaluationAsync(string evaluationID);
        Task<List<JudgeDashboardAssignmentAPIViewModel>> GetDashboardAssignmentsAsync(string teacherId);

    }
}
