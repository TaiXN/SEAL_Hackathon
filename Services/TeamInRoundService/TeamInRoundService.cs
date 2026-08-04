using APIViewModels.TeamInRound;
using APIViewModels.TeamProject;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services.TeamInRoundService
{
    public class TeamInRoundService : ITeamInRoundService
    {
        private readonly IUnitOfWork _uow;

        public TeamInRoundService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateTeamInRoundAsync(string accountId, string teamId, SubmitProjectAPIViewModel request)
        {
            TeamMember myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);
            if (myTeamInfo == null) throw new Exception("You are not in this team.");
            if (!myTeamInfo.IsLeader) throw new Exception("Only team leader can choose.");

            Team currentTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (currentTeam == null)
                throw new Exception("This team experienced a data error; the team could not be found.");

            List<Team> sameNameTeams = await _uow.Team.GetAllAsync(t => t.TeamName.ToLower() == currentTeam.TeamName.ToLower() && t.TeamId != teamId);

            if (sameNameTeams.Any())
            {
                List<string> sameNameTeamIds = sameNameTeams.Select(t => t.TeamId).ToList();
                List<TeamInRound> sameNameRegistered = await _uow.TeamInRound.GetAllAsync(tr => sameNameTeamIds.Contains(tr.TeamId));

                foreach (TeamInRound reg in sameNameRegistered)
                {
                    Track regTrack = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == reg.TrackId);
                    if (regTrack != null && regTrack.EventId == request.EventId)
                    {
                        throw new Exception($"Submit failed! The name '{currentTeam.TeamName}' was just locked in by another team for this event. Please update your team name in your dashboard and try again.");
                    }
                }
            }

            Event selectedEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == request.EventId && e.IsActive == true);
            if (selectedEvent == null) throw new Exception("This event does not exist or is no longer active.");

            if (selectedEvent.CurrentRound == -1)
                throw new Exception("This event is still in the Draft stage and not open for registration.");
            if (selectedEvent.CurrentRound > 0)
                throw new Exception("Registration is closed. The event has already started.");

            DateTime vnNow = DateTime.UtcNow.AddHours(7);
            if (vnNow < selectedEvent.RegistrationStartDate)
                throw new Exception("Registration for this event has not opened yet!");
            if (vnNow > selectedEvent.RegistrationEndDate)
                throw new Exception("Registration has expired! The deadline to join this event has passed.");


            List<TeamMember> allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            if (memberCount < selectedEvent.MinTeamMember)
            {
                throw new Exception($"Your team does not have enough members to join this event. Required minimum: {selectedEvent.MinTeamMember} members (Current: {memberCount}).");
            }

            if (memberCount > selectedEvent.MaxTeamMember)
            {
                throw new Exception($"Your team exceeds the maximum member limit for this event. Allowed maximum: {selectedEvent.MaxTeamMember} members (Current: {memberCount}).");
            }


            List<Round> roundsOfEvent = await _uow.Round.GetAllAsync(r => r.EventId == request.EventId);
            List<string> roundIds = roundsOfEvent.Select(r => r.RoundId).ToList();

            TeamInRound existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId && roundIds.Contains(s.RoundId));
            if (existingSubmit != null) throw new Exception("Your team has already locked the competition category for this event, resubmission is not possible!");

            List<string> currentTeamMemberIds = allMembers.Where(tm => tm.TeamId == teamId).Select(tm => tm.StudentId).ToList();

            List<TeamInRound> allSubmittedTeamsInEvent = await _uow.TeamInRound.GetAllAsync(tr => roundIds.Contains(tr.RoundId));
            List<string> submittedTeamIds = allSubmittedTeamsInEvent.Select(tr => tr.TeamId).ToList();

            List<TeamMember> overlappingMembers = allMembers.Where(tm =>
                currentTeamMemberIds.Contains(tm.StudentId) &&
                submittedTeamIds.Contains(tm.TeamId) &&
                tm.TeamId != teamId
            ).ToList();

            if (overlappingMembers.Any())
            {
                IEnumerable<string> cheatingStudentIds = overlappingMembers.Select(m => m.StudentId).Distinct();
                string names = string.Join(", ", cheatingStudentIds);
                throw new Exception($"Submit failed! Member(s) [{names}] have already registered for this event under another team.");
            }

            Round round1 = roundsOfEvent.FirstOrDefault(r => r.RoundIndex == 1);
            if (round1 == null) throw new Exception("This event is not configured for Round 1!");

            List<TeamInRound> totalRegisteredTeams = await _uow.TeamInRound.GetAllAsync(tr => tr.RoundId == round1.RoundId);
            if (totalRegisteredTeams.Count() >= round1.MaxTeam)
            {
                throw new Exception($"Registration failed! The event has reached its maximum capacity of {round1.MaxTeam} teams.");
            }

            Track track = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == request.TrackId && t.IsActive == true);
            if (track == null || track.EventId != request.EventId)
                throw new Exception("This track doesn't exist, is locked, or doesn't belong to the selected event.");

            List<TeamInRound> currentSubmissionsInTrack = await _uow.TeamInRound.GetAllAsync(s => s.TrackId == request.TrackId);
            if (currentSubmissionsInTrack.Count() >= track.MaxTeam)
            {
                throw new Exception($"This track has reached its maximum capacity of {track.MaxTeam} teams.");
            }

            Topic topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == request.TopicId && t.TrackId == request.TrackId && t.IsActive == true);
            if (topic == null) throw new Exception("Topic doesn't belong to this track.");

            TeamInRound newSubmit = new TeamInRound
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

        public async Task<List<TeamInRoundDetailAPIViewModel>> GetTeamsDetailsByRoundIdAsync(string roundId)
        {
            if (string.IsNullOrEmpty(roundId))
                throw new ArgumentException("\r\nRoundID cannot be left blank.");

            List<TeamInRound> teamInRounds = await _uow.TeamInRound.GetAllQueryable()
                .Include(tir => tir.Team)
                .Include(tir => tir.Track)
                .Include(tir => tir.Round)
                .Where(tir => tir.RoundId == roundId)
                .AsNoTracking()
                .ToListAsync();

            List<TeamInRoundDetailAPIViewModel> result = teamInRounds.Select(tir => new TeamInRoundDetailAPIViewModel
            {
                TeamInRoundID = tir.Id,
                TeamId = tir.TeamId,
                TeamName = tir.Team?.TeamName ?? "N/A",
                TrackId = tir.TrackId,
                TrackName = tir.Track?.TrackName ?? "N/A",
                RoundId = tir.RoundId,
                RoundName = tir.Round?.RoundName ?? "N/A",
                TopicId = tir.TopicId,
                IsBanned = tir.IsBanned,
                IsCheck = tir.IsCheck
            }).ToList();

            return result;
        }

        public async Task<bool> CheckTeamInRoundAsync(string teamInRoundId)
        {
            try
            {
                TeamInRound teamDb = await _uow.TeamInRound.GetFirstOrDefaultAsync(t => t.Id == teamInRoundId);
                if (teamDb == null) return false;

                if (teamDb.IsCheck == true) return true;

                teamDb.IsCheck = true;

                _uow.TeamInRound.Update(teamDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> BanTeamInRoundAsync(string teamInRoundId)
        {
            try
            {
                TeamInRound teamDb = await _uow.TeamInRound.GetFirstOrDefaultAsync(t => t.Id == teamInRoundId);
                if (teamDb == null) return false;

                if (teamDb.IsBanned == true) return true;

                teamDb.IsBanned = true;

                _uow.TeamInRound.Update(teamDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> UnbanTeamInRoundAsync(string teamInRoundId)
        {
            try
            {
                TeamInRound teamDb = await _uow.TeamInRound.GetFirstOrDefaultAsync(t => t.Id == teamInRoundId);
                if (teamDb == null) return false;

                if (teamDb.IsBanned == false) return true;

                teamDb.IsBanned = false;

                _uow.TeamInRound.Update(teamDb);
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