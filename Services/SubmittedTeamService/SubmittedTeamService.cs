using APIViewModels.TeamProject;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Services.SubmittedTeamService
{
    public class SubmittedTeamService : ISubmittedTeamService
    {
        private readonly IUnitOfWork _uow;

        public SubmittedTeamService(IUnitOfWork uow) { _uow = uow; }

        public async Task<bool> SubmitTopicAsync(string accountId, SubmitProjectAPIViewModel request)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == accountId, "TeamMembers");
            if (student == null || student.TeamMembers == null || !student.TeamMembers.Any())
                throw new Exception("You are not currently in any team.");

            var myTeamInfo = student.TeamMembers.FirstOrDefault();

            if (!myTeamInfo.IsLeader)
                throw new Exception("Only the Team Leader can submit the track and topic.");

            string teamId = myTeamInfo.TeamId;

            var allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);
            if (memberCount < 3)
                throw new Exception($"Your team must have at least 3 members. You currently have {memberCount}.");

            var existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (existingSubmit != null)
                throw new Exception("Your team has already submitted a track.");

            var track = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == request.TrackId && t.IsActive == true);
            if (track == null)
                throw new Exception("Submit failed! The selected Track does not exist or is currently INACTIVE.");

            var currentSubmissionsInTrack = await _uow.TeamInRound.GetAllAsync(s => s.TrackId == request.TrackId);
            if (currentSubmissionsInTrack.Count() >= 6)
                throw new Exception("Submit failed! This Track has reached the maximum limit of 6 teams.");

            var topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == request.TopicId && t.TrackId == request.TrackId && t.IsActive == true);
            if (topic == null)
                throw new Exception("Submit failed! The selected Topic is invalid, inactive, or does not belong to this Track.");

            var activeRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.EndDate > DateTime.Now);
            if (activeRound == null)
                throw new Exception("There is no active round to submit!");

            var newSubmit = new TeamInRound
            {
                Id = Guid.NewGuid().ToString(),
                TeamId = teamId,
                TrackId = request.TrackId,
                TopicId = request.TopicId,
                RoundId = activeRound.RoundId,
                IsBanned = false,
                IsCheck = false
            };

            await _uow.TeamInRound.AddAsync(newSubmit);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> SubmitGithubUrlAsync(string accountId, SubmitGithubAPIViewModel request)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == accountId, "TeamMembers");
            if (student == null || student.TeamMembers == null || !student.TeamMembers.Any())
                throw new Exception("You are not currently in any team.");

            var myTeamInfo = student.TeamMembers.FirstOrDefault();
            if (!myTeamInfo.IsLeader)
                throw new Exception("Only the Team Leader can submit the Github URL.");

            var teamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == myTeamInfo.TeamId);
            if (teamInRound == null)
                throw new Exception("Your team must register for a Track and Topic before submitting the Github URL.");

            var existingSubmission = await _uow.Submission.GetFirstOrDefaultAsync(s => s.TeamInRoundId == teamInRound.Id);

            if (existingSubmission != null)
            {
                existingSubmission.UrlGithub = request.GithubUrl;
                _uow.Submission.Update(existingSubmission);
            }
            else
            {
                // Chưa nộp thì tạo mới
                var newSubmission = new Submission
                {
                    Id = Guid.NewGuid().ToString(),
                    TeamInRoundId = teamInRound.Id,
                    UrlGithub = request.GithubUrl
                };
                await _uow.Submission.AddAsync(newSubmission);
            }

            await _uow.SaveAsync();
            return true;
        }
    }
}