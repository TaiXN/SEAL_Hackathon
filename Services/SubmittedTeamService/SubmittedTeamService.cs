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

        public async Task<bool> SubmitTopicAsync(string accountId, string teamId, SubmitProjectAPIViewModel request)
        {
            var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);
            if (myTeamInfo == null) throw new Exception("you are not in this team");
            if (!myTeamInfo.IsLeader) throw new Exception("only team leader can choose ");

            var currentTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (currentTeam == null)
                throw new Exception("This team experienced a data error; the team could not be found.");

            var existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (existingSubmit != null) throw new Exception("Your team has already locked the competition category, resubmission is not possible!");

            var allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);
            if (memberCount < 3) throw new Exception($"The team must have at least 3 members (Current: {memberCount}).");

            var selectedEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == request.EventId && e.IsActive == true);
            if (selectedEvent == null) throw new Exception("This event does not exist or is no longer active.");

            
            var roundsOfEvent = await _uow.Round.GetAllAsync(r => r.EventId == request.EventId);
            var currentTeamMemberIds = allMembers.Where(tm => tm.TeamId == teamId).Select(tm => tm.StudentId).ToList();
            var roundIds = roundsOfEvent.Select(r => r.RoundId).ToList();

            var allSubmittedTeamsInEvent = await _uow.TeamInRound.GetAllAsync(tr => roundIds.Contains(tr.RoundId));
            var submittedTeamIds = allSubmittedTeamsInEvent.Select(tr => tr.TeamId).ToList();

            var overlappingMembers = allMembers.Where(tm =>
                currentTeamMemberIds.Contains(tm.StudentId) &&
                submittedTeamIds.Contains(tm.TeamId) &&
                tm.TeamId != teamId
            ).ToList();

            if (overlappingMembers.Any())
            {
                var cheatingStudentIds = overlappingMembers.Select(m => m.StudentId).Distinct();
                string names = string.Join(", ", cheatingStudentIds);
                throw new Exception($"Submit failed! Member(s) [{names}] have already registered for this event under another team.");
            }

            
            var round1 = roundsOfEvent.FirstOrDefault(r => r.RoundIndex == 1);
            if (round1 == null) throw new Exception("This event is not configured for Round 1!");



            if (DateTime.Now >= round1.StartDate)
                throw new Exception("Registration has expired! This event has officially started.");

            var track = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == request.TrackId && t.IsActive == true);
            if (track == null || track.EventId != request.EventId)
                throw new Exception("This track doesn't exist, is locked, or doesn't belong to the selected event.");

            var currentSubmissionsInTrack = await _uow.TeamInRound.GetAllAsync(s => s.TrackId == request.TrackId);
            if (currentSubmissionsInTrack.Count() >= 6) throw new Exception("this track have reach the maximum of 6");

            var topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == request.TopicId && t.TrackId == request.TrackId && t.IsActive == true);
            if (topic == null) throw new Exception("topic doesnt belong to this track");

            
            var newSubmit = new TeamInRound
            {
                Id = Guid.NewGuid().ToString(),
                TeamId = teamId,
                RoundId = round1.RoundId,
                TrackId = request.TrackId,
                TopicId = request.TopicId,
                IsBanned = false,
                IsCheck = false 
            };

            await _uow.TeamInRound.AddAsync(newSubmit);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> SubmitUrlAsync(string accountId, string teamId, SubmitGithubAPIViewModel request)
        {
            var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);

            if (myTeamInfo == null) throw new Exception("You are not currently in this team.");
            if (!myTeamInfo.IsLeader) throw new Exception("Only the Team Leader can submit the Github URL.");

            var teamInRound = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == teamId);
            if (teamInRound == null) throw new Exception("Your team must register for a Track and Topic before submitting the Github URL.");

            var currentRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == teamInRound.RoundId);
            if (currentRound == null) throw new Exception("cant find this round");
            if (currentRound.EndDate < DateTime.Now) throw new Exception($"expired submitting: {currentRound.EndDate:dd/MM/yyyy HH:mm}");

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