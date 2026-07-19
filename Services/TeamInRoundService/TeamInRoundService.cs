using APIViewModels.TeamInRound;
using APIViewModels.TeamProject;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

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
            var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);
            if (myTeamInfo == null) throw new Exception("you are not in this team");
            if (!myTeamInfo.IsLeader) throw new Exception("only team leader can choose ");

            var currentTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (currentTeam == null)
                throw new Exception("This team experienced a data error; the team could not be found.");

            var selectedEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == request.EventId && e.IsActive == true);
            if (selectedEvent == null) throw new Exception("This event does not exist or is no longer active.");

            var roundsOfEvent = await _uow.Round.GetAllAsync(r => r.EventId == request.EventId);
            var roundIds = roundsOfEvent.Select(r => r.RoundId).ToList();

            var existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId && roundIds.Contains(s.RoundId));
            if (existingSubmit != null) throw new Exception("Your team has already locked the competition category for this event, resubmission is not possible!");

            var allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);
            if (memberCount < 3) throw new Exception($"The team must have at least 3 members (Current: {memberCount}).");

            var currentTeamMemberIds = allMembers.Where(tm => tm.TeamId == teamId).Select(tm => tm.StudentId).ToList();

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
