using APIViewModels.Submission;
using APIViewModels.TeamProject;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System.Linq;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Services.SubmissionService
{
    public class SubmissionService : ISubmissionService
    {
        private readonly IUnitOfWork _uow;

        public SubmissionService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> SubmitUrlAsync(string accountId, string teamId, SubmitGithubAPIViewModel request)
        {
            var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);

            if (myTeamInfo == null) throw new Exception("You are not currently in this team.");
            if (!myTeamInfo.IsLeader) throw new Exception("Only the Team Leader can submit the project URLs.");

            var allTeamRounds = await _uow.TeamInRound.GetAllAsync(tr => tr.TeamId == teamId);
            TeamInRound teamInRound = null;
            Round currentRound = null;

            foreach (var tr in allTeamRounds)
            {
                var r = await _uow.Round.GetFirstOrDefaultAsync(x => x.RoundId == tr.RoundId);
                if (r != null)
                {
                    if (currentRound == null || r.RoundIndex > currentRound.RoundIndex)
                    {
                        currentRound = r;
                        teamInRound = tr;
                    }
                }
            }

            if (teamInRound == null) throw new Exception("Your team must register for a Track and Topic before submitting URLs.");

            if (!teamInRound.IsCheck)
                throw new Exception("Your team has not been approved by the Admin yet. Please wait for approval before submitting.");

            if (teamInRound.IsBanned)
                throw new Exception("Your team has been banned from this round. Submission is locked.");

            if (currentRound == null) throw new Exception("Cannot find this round");

            if (DateTime.Now < currentRound.StartDate)
                throw new Exception($"The round has not started yet. Submission will open at: {currentRound.StartDate:dd/MM/yyyy HH:mm}");

            if (DateTime.Now > currentRound.EndDate)
                throw new Exception($"Expired submitting! The round ended at: {currentRound.EndDate:dd/MM/yyyy HH:mm}");

            var existingSubmission = await _uow.Submission.GetFirstOrDefaultAsync(s => s.TeamInRoundId == teamInRound.Id);

            DateTime vnNow = DateTime.UtcNow.AddHours(7);

            if (existingSubmission != null)
            {
                var auditLog = new SubmissionAuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    SubmissionId = existingSubmission.Id,
                    TeamId = teamId,
                    EventId = currentRound.EventId,
                    RoundId = currentRound.RoundId,
                    OldUrlGithub = existingSubmission.Urlgithub,
                    OldUrlDemo = existingSubmission.Urldemo,
                    OldUrlSlide = existingSubmission.Urlslide,
                    NewUrlGithub = request.UrlGithub,
                    NewUrlDemo = request.UrlDemo,
                    NewUrlSlide = request.UrlSlide,
                    CreatedAt = vnNow
                };
                await _uow.SubmissionAuditLog.AddAsync(auditLog);

                existingSubmission.Urlgithub = request.UrlGithub;
                existingSubmission.Urldemo = request.UrlDemo;
                existingSubmission.Urlslide = request.UrlSlide;

                _uow.Submission.Update(existingSubmission);
            }
            else
            {
                var newSubmission = new Submission
                {
                    Id = Guid.NewGuid().ToString(),
                    TeamInRoundId = teamInRound.Id,
                    Urlgithub = request.UrlGithub,
                    Urldemo = request.UrlDemo,
                    Urlslide = request.UrlSlide
                };
                await _uow.Submission.AddAsync(newSubmission);

                var auditLog = new SubmissionAuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    SubmissionId = newSubmission.Id,
                    TeamId = teamId,
                    EventId = currentRound.EventId,
                    RoundId = currentRound.RoundId,
                    OldUrlGithub = "N/A (First Submission)",
                    OldUrlDemo = "N/A (First Submission)",
                    OldUrlSlide = "N/A (First Submission)",
                    NewUrlGithub = request.UrlGithub,
                    NewUrlDemo = request.UrlDemo,
                    NewUrlSlide = request.UrlSlide,
                    CreatedAt = vnNow
                };
                await _uow.SubmissionAuditLog.AddAsync(auditLog);
            }

            await _uow.SaveAsync();
            return true;
        }

        public async Task<List<SubmissionAuditLogAPIViewModel>> GetAuditLogsByTeamAsync(string teamId)
        {
            try
            {
                var logs = await _uow.SubmissionAuditLog.GetAllAsync(x => x.TeamId == teamId);

                var result = logs.OrderByDescending(x => x.CreatedAt).Select(log => new SubmissionAuditLogAPIViewModel
                {
                    LogId = log.Id,
                    SubmissionId = log.SubmissionId,
                    TeamId = log.TeamId,
                    EventId = log.EventId,
                    RoundId = log.RoundId,
                    OldUrlGithub = log.OldUrlGithub,
                    OldUrlDemo = log.OldUrlDemo,
                    OldUrlSlide = log.OldUrlSlide,
                    NewUrlGithub = log.NewUrlGithub,
                    NewUrlDemo = log.NewUrlDemo,
                    NewUrlSlide = log.NewUrlSlide,
                    CreatedAt = log.CreatedAt
                }).ToList();

                return result;
            }
            catch (Exception ex)
            {
                return new List<SubmissionAuditLogAPIViewModel>();
            }
        }

        public async Task<List<SubmissionAPIViewModel>> GetAllSubmissionsAsync()
        {
            try
            {
                List<Submission> submissions = await _uow.Submission.GetAllAsync();

                List<SubmissionAPIViewModel> result = new List<SubmissionAPIViewModel>();
                foreach (Submission sub in submissions)
                {
                    SubmissionAPIViewModel viewModel = new SubmissionAPIViewModel()
                    {
                        SubmissionId = sub.Id,
                        TeamInRoundId = sub.TeamInRoundId,
                        UrlGithub = sub.Urlgithub,
                        UrlDemo = sub.Urldemo,
                        UrlSlide = sub.Urlslide,
                        AverageScore = sub.AverageScore
                    };

                    result.Add(viewModel);
                }

                return result;
            }
            catch (Exception ex)
            {
                return new List<SubmissionAPIViewModel>();
            }
        }
    }
}