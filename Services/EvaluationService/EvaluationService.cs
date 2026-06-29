using APIViewModels.Evaluation;
using APIViewModels.Event;
using Azure.Messaging;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.LeaderBoardService;
using System;
using System.Collections.Generic;
using System.Text;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Services.EvaluationService
{
    public class EvaluationService : IEvaluationService
    {
        private readonly IUnitOfWork _uow;
        private readonly ILeaderBoardService _leaderBoardService;
        public EvaluationService(IUnitOfWork uow, ILeaderBoardService leaderBoardService)
        {
            _uow = uow;
            _leaderBoardService = leaderBoardService;
        }

        public async Task<bool> CreateEvaluateAsync(string teacherId, EvaluationAPIViewModel info)
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

                await CalculateAndUpdateAverageScoreAsync(
                      info.SubmissionID,
                      submission.TeamInRound.TrackId,
                      submission.TeamInRound.RoundId,
                      submission.TeamInRound.Id
                     );

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

                await CalculateAndUpdateAverageScoreAsync(
                    evalDb.SubmissionId,
                    submission.TeamInRound.TrackId,
                    submission.TeamInRound.RoundId,
                    submission.TeamInRound.Id
                );

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

                Submission submission = await _uow.Submission.GetFirstOrDefaultAsync(q => q.Id == result.SubmissionId, "TeamInRound");

                _uow.Evaluation.Remove(result);
                await _uow.SaveAsync();

                if (submission != null && submission.TeamInRound != null)
                {
                    await CalculateAndUpdateAverageScoreAsync(
                        submission.Id,
                        submission.TeamInRound.TrackId,
                        submission.TeamInRound.RoundId,
                        submission.TeamInRound.Id
                    );
                }

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        private async Task<bool> CalculateAndUpdateAverageScoreAsync(string submissionId, string trackId, string roundId, string teamInRoundId)
        {
            try
            {

                List<TeacherList> trackJudges = await _uow.TeacherList.GetAllAsync(q => q.TrackId == trackId && !q.IsMentor);
                int totalJudges = trackJudges.Count();

                List<Evaluation> evals = await _uow.Evaluation.GetAllAsync(q => q.SubmissionId == submissionId);
                double sumScore = evals.Sum(q => q.Score);

                double aveScore = 0;

                if (totalJudges > 0)
                {    
                    double calculate = sumScore / totalJudges;
              
                    aveScore = Math.Round(calculate, 2);
                }
                else
                {             
                    aveScore = 0;
                }


                Submission submission = await _uow.Submission.GetFirstOrDefaultAsync(q => q.Id == submissionId);
                if (submission != null)
                {
                    submission.AverageScore = aveScore;
                    _uow.Submission.Update(submission);
                    await _uow.SaveAsync();
                }


                await _leaderBoardService.UpdateRankRealTimeAsync(roundId, trackId, teamInRoundId, aveScore);
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }

}

