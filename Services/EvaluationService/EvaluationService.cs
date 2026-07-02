using APIViewModels.Evaluation;
using APIViewModels.Event;
using APIViewModels.Judge;
using Azure.Messaging;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;
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

        public async Task<List<EvaluationDetailAPIViewModel>> GetAllEvaluationsDetailedAsync()
        {
            try
            {
                List<Evaluation> evals = await _uow.Evaluation.GetAllAsync();

                List<EvaluationDetailAPIViewModel> result = new List<EvaluationDetailAPIViewModel>();

                foreach (Evaluation eval in evals)
                {
                    Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == eval.TeacherId);

                    EvaluationDetailAPIViewModel viewModel = new EvaluationDetailAPIViewModel()
                    {
                        EvaluationID = eval.Id,
                        SubmissionID = eval.SubmissionId,
                        TeacherID = eval.TeacherId,
                        Score = eval.Score,
                        Reason = eval.Reason
                    };

                    if (accountDb != null)
                    {
                        viewModel.TeacherName = accountDb.FullName;
                    }
                    else
                    {
                        viewModel.TeacherName = "Unknown Teacher";
                    }

                    result.Add(viewModel);
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<EvaluationDetailAPIViewModel>();
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

        public async Task<List<EvaluationDetailAPIViewModel>> GetEvaluationsBySubmissionIdAsync(string submissionId)
        {
            List<EvaluationDetailAPIViewModel> result = new List<EvaluationDetailAPIViewModel>();
            try
            {
                Submission submission = await _uow.Submission.GetFirstOrDefaultAsync(s => s.Id == submissionId, "TeamInRound");
                if (submission == null || submission.TeamInRound == null) return result;

                string trackId = submission.TeamInRound.TrackId;

                List<TeacherList> assignedJudges = await _uow.TeacherList.GetAllAsync(t => t.TrackId == trackId && !t.IsMentor);

                foreach (TeacherList judge in assignedJudges)
                {
                    Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == judge.TeacherId);

                    EvaluationDetailAPIViewModel viewModel = new EvaluationDetailAPIViewModel()
                    {
                        SubmissionID = submissionId,
                        TeacherID = judge.TeacherId,
                    };

                    if (accountDb != null)
                    {
                        viewModel.TeacherName = accountDb.FullName;
                    }
                    else
                    {
                        viewModel.TeacherName = "Unknown Teacher";
                    }


                    Evaluation evalDb = await _uow.Evaluation.GetFirstOrDefaultAsync(e =>
                        e.SubmissionId == submissionId &&
                        e.TeacherId == judge.TeacherId);

                    if (evalDb != null)
                    {

                        viewModel.EvaluationID = evalDb.Id;
                        viewModel.Score = evalDb.Score;
                        viewModel.Reason = evalDb.Reason;
                    }
                    else
                    {

                        viewModel.EvaluationID = null;
                        viewModel.Score = null;
                        viewModel.Reason = "Not evaluated yet";
                    }

                    result.Add(viewModel);
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<EvaluationDetailAPIViewModel>();
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

        public async Task<List<JudgeDashboardAssignmentAPIViewModel>> GetDashboardAssignmentsAsync(string teacherId)
        {
            try
            {
            
                List<string> assignedTrackIds = await _uow.TeacherList.GetAllQueryable()
                    .Where(t => t.TeacherId == teacherId && !t.IsMentor)
                    .Select(t => t.TrackId)
                    .ToListAsync();

                if (!assignedTrackIds.Any()) return new List<JudgeDashboardAssignmentAPIViewModel>();

              
                List<TeamInRound> teamInRounds = await _uow.TeamInRound.GetAllQueryable()
                    .Include(tir => tir.Team)
                    .Include(tir => tir.Track)
                    .Include(tir => tir.Round)
                    .Where(tir => assignedTrackIds.Contains(tir.TrackId))
                    .AsNoTracking()
                    .ToListAsync();

                List<string> tirIds = teamInRounds.Select(tir => tir.Id).ToList();

              
                List<Submission> submissions = await _uow.Submission.GetAllQueryable()
                    .Where(s => tirIds.Contains(s.TeamInRoundId))
                    .AsNoTracking()
                    .ToListAsync();

                List<string> submissionIds = submissions.Select(s => s.Id).ToList();

               
                List<Evaluation> evaluations = await _uow.Evaluation.GetAllQueryable()
                    .Where(e => e.TeacherId == teacherId && submissionIds.Contains(e.SubmissionId))
                    .AsNoTracking()
                    .ToListAsync();

              
                List<JudgeDashboardAssignmentAPIViewModel> result = new List<JudgeDashboardAssignmentAPIViewModel>();

                foreach (TeamInRound tir in teamInRounds)
                {
                   
                    Submission submission = submissions.FirstOrDefault(s => s.TeamInRoundId == tir.Id);

                    
                    Evaluation evaluation = submission != null ? evaluations.FirstOrDefault(e => e.SubmissionId == submission.Id) : null;

                    JudgeDashboardAssignmentAPIViewModel model = new JudgeDashboardAssignmentAPIViewModel()
                    {
                        TeamId = tir.TeamId,
                        TeamName = tir.Team?.TeamName ?? "N/A",
                        TrackName = tir.Track?.TrackName ?? "N/A",
                        EventName = tir.Round?.RoundName ?? "N/A",

                        
                        CriteriaSetId = tir.TrackId,

                   
                        SubmissionId = submission?.Id,
                        EvaluationId = evaluation?.Id,
                        Score = evaluation?.Score
                    };

                    result.Add(model);
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<JudgeDashboardAssignmentAPIViewModel>();
            }
        }
    }

}

