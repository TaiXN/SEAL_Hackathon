using APIViewModels.Evaluation;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.EvaluationService
{
    public interface IEvaluationService
    {
        Task<bool> EvaluateSubmissionAsync(string teacherId, EvaluationAPIViewModel info);
        Task<List<Evaluation>> GetEvaluationsBySubmissionAsync(string submissionId);

    }
}
