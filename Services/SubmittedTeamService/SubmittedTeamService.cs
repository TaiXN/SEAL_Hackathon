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

        //public async Task<bool> SubmitTopicAsync(string accountId, string teamId, SubmitProjectAPIViewModel request)
        //{
        //    var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);
        //    if (myTeamInfo == null) throw new Exception("you are not in this team");
        //    if (!myTeamInfo.IsLeader) throw new Exception("only team leader can choose ");

        //    //var currentTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
        //    ////if (currentTeam == null || string.IsNullOrEmpty(currentTeam.EventId))
        //    //    throw new Exception("This team experienced a data error; their participation event could not be found.");

        //    var existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
        //    if (existingSubmit != null) throw new Exception("Your team has already locked the competition category, resubmission is not possible!");

        //    var allMembers = await _uow.TeamMember.GetAllAsync();
        //    int memberCount = allMembers.Count(ut => ut.TeamId == teamId);
        //    if (memberCount < 3) throw new Exception($"The team must have at least 3 members (Current: {memberCount}).");

        //    var roundsOfEvent = await _uow.Round.GetAllAsync(r => r.EventId == currentTeam.EventId);
        //    var activeRound = roundsOfEvent.FirstOrDefault(r => r.EndDate > DateTime.Now);
        //    if (activeRound == null) throw new Exception("No active rounds are open for submission!");

        //    var track = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == request.TrackId && t.IsActive == true);
        //    if (track == null) throw new Exception("Hạng mục này không tồn tại hoặc đã bị khóa.");

        //    var currentSubmissionsInTrack = await _uow.TeamInRound.GetAllAsync(s => s.TrackId == request.TrackId);
        //    if (currentSubmissionsInTrack.Count() >= 6) throw new Exception("Hạng mục này đã đạt giới hạn tối đa 6 đội tham gia.");

        //    var topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == request.TopicId && t.TrackId == request.TrackId && t.IsActive == true);
        //    if (topic == null) throw new Exception("Đề tài không hợp lệ hoặc không thuộc về Hạng mục này.");

        //    var newSubmit = new TeamInRound
        //    {
        //        Id = Guid.NewGuid().ToString(),
        //        TeamId = teamId,
        //        RoundId = activeRound.RoundId,
        //        TrackId = request.TrackId,
        //        TopicId = request.TopicId,
        //        IsBanned = false,
        //        IsCheck = false
        //    };

        //    await _uow.TeamInRound.AddAsync(newSubmit);
        //    await _uow.SaveAsync();

        //    return true;
        //}

        public async Task<bool> SubmitUrlAsync(string accountId, string teamId, SubmitGithubAPIViewModel request)
        {
            var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);

            if (myTeamInfo == null)
                throw new Exception("You are not currently in this team.");

            if (!myTeamInfo.IsLeader)
                throw new Exception("Only the Team Leader can submit the Github URL.");

            var teamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == teamId);
            if (teamInRound == null)
                throw new Exception("Your team must register for a Track and Topic before submitting the Github URL.");

            var existingSubmission = await _uow.Submission.GetFirstOrDefaultAsync(s => s.TeamInRoundId == teamInRound.Id);

            if (existingSubmission != null)
            {
                existingSubmission.Urlgithub = request.UrlGithub;

                _uow.Submission.Update(existingSubmission);
            }
            else
            {
                var newSubmission = new Submission
                {
                    Id = Guid.NewGuid().ToString(),
                    TeamInRoundId = teamInRound.Id,
                    Urlgithub = request.UrlGithub,

                };
                await _uow.Submission.AddAsync(newSubmission);
            }

            await _uow.SaveAsync();
            return true;
        }
    }
}