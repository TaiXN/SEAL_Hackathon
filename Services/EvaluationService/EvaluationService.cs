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

                Track track = await _uow.Track.GetFirstOrDefaultAsync(q => q.TrackId == info.TrackID && q.IsActive);
                if (track == null) return false;

                TeacherList judge = await _uow.TeacherList.GetFirstOrDefaultAsync(q=> q.TrackId == info.TrackID && q.TeacherId == teacherId && !q.IsMentor);
                if(judge == null) return false;

                Evaluation newEval = new Evaluation()
                {
                    Id = Guid.NewGuid().ToString(),
                    SubmissionId = info.SubmissionID,
                    TeacherId = teacherId,
                    Score = info.Score,
                    Reason = info.Reason,
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

    
    }
}
