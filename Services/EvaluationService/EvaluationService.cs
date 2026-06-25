using APIViewModels.Evaluation;
using APIViewModels.Event;
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
                Submission submission = await _uow.Submission.GetFirstOrDefaultAsync(q => q.Id == info.SubmissionID, "TeamInRound");
                if (submission == null || submission.TeamInRound == null) return false;

                TeacherList teacherlist = await _uow.TeacherList.GetFirstOrDefaultAsync(q => q.TrackId == submission.TeamInRound.TrackId && !q.IsMentor && q.TeacherId == teacherId);
                if (teacherlist == null) return false;

                Evaluation newEval = new Evaluation()
                {
                    Id = Guid.NewGuid().ToString(),
                    SubmissionId = info.SubmissionID,
                    Score = info.Score,
                    Reason = info.Reason,
                    TeacherId = teacherId
                };

                await _uow.Evaluation.AddAsync(newEval);
                await _uow.SaveAsync();
                return true;

            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<Evaluation>> GetAllEventsAsync()
        {
            try
            {
                List<Evaluation> result = await _uow.Evaluation.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Evaluation>();
            }
        }

        public async Task<Evaluation> GetEvaluationByIdAsync(string evaluationID)
        {
            try
            {
                return await _uow.Evaluation.GetFirstOrDefaultAsync(e => e.Id == evaluationID);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateEvaluationAsync(string teacherId, UpdateEvaluationAPIViewModel info)
        {
            try
            {
                Evaluation evalDb = await _uow.Evaluation.GetFirstOrDefaultAsync(q => q.Id == info.EvaluationID && q.TeacherId == teacherId);
                if (evalDb == null) return false;

                Submission submission = await _uow.Submission.GetFirstOrDefaultAsync(q => q.Id == evalDb.SubmissionId, "TeamInRound");
                if (submission == null || submission.TeamInRound == null) return false;

                TeacherList teacherlist = await _uow.TeacherList.GetFirstOrDefaultAsync(q =>
                    q.TrackId == submission.TeamInRound.TrackId &&
                    q.TeacherId == teacherId &&
                    !q.IsMentor);

                if (teacherlist == null) return false;

                evalDb.Score = info.Score;
                evalDb.Reason = info.Reason;
                _uow.Evaluation.Update(evalDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteEvaluationAsync(string evaluationID)
        {
            try
            {
                Evaluation result = await _uow.Evaluation.GetFirstOrDefaultAsync(q => q.Id.Equals(evaluationID));

                if (result == null) return false;

                _uow.Evaluation.Remove(result);
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
