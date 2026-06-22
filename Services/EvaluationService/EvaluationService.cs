using APIViewModels.Evaluation;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.EvaluationService
{
    public class EvaluationService : IEvaluationService
    {
        private readonly IUnitOfWork _uow;
        public EvaluationService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> EvaluateSubmissionAsync(string teacherId, EvaluationAPIViewModel info)
        {
            try
            { 
                Submission checkSubmission = await _uow.Submission.GetFirstOrDefaultAsync(q => q.Id == info.SubmissionID);
                if (checkSubmission == null) return false;
        
                TeamInRound teamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(q => q.Id == checkSubmission.TeamInRoundId);
                if (teamInRound == null) return false;

                Evaluation evalDb = await _uow.Evaluation.GetFirstOrDefaultAsync(q => q.SubmissionId == info.SubmissionID && q.TeacherId == teacherId);

                if (evalDb != null)
                {
                    evalDb.Score = info.Score;
                    evalDb.Reason = info.Reason;
                    _uow.Evaluation.Update(evalDb);
                }
                else
                {
                    Evaluation newEval = new Evaluation()
                    {
                        Id = Guid.NewGuid().ToString(),
                        SubmissionId = info.SubmissionID,
                        TeacherId = teacherId,
                        Score = info.Score,
                        Reason = info.Reason
                    };
                    await _uow.Evaluation.AddAsync(newEval);
                }

                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<Evaluation>> GetEvaluationsBySubmissionAsync(string submissionId)
        {
            try
            {
                List<Evaluation> result = await _uow.Evaluation.GetAllAsync(q => q.SubmissionId == submissionId);
                return result.ToList();
            }
            catch
            {
                return new List<Evaluation>();
            }
        }
    }
}
