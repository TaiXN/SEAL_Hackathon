using APIViewModels.TeamProject;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

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

            var teamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == teamId);
            if (teamInRound == null) throw new Exception("Your team must register for a Track and Topic before submitting URLs.");

            var currentRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == teamInRound.RoundId);
            if (currentRound == null) throw new Exception("Cannot find this round");

            if (DateTime.Now < currentRound.StartDate)
                throw new Exception($"The round has not started yet. Submission will open at: {currentRound.StartDate:dd/MM/yyyy HH:mm}");

            if (DateTime.Now > currentRound.EndDate)
                throw new Exception($"Expired submitting! The round ended at: {currentRound.EndDate:dd/MM/yyyy HH:mm}");

            var existingSubmission = await _uow.Submission.GetFirstOrDefaultAsync(s => s.TeamInRoundId == teamInRound.Id);

            if (existingSubmission != null)
            {
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
            }

            await _uow.SaveAsync();
            return true;
        }
    }
}
