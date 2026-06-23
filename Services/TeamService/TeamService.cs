using APIViewModels.Team;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services.TeamService
{
    public class TeamService : ITeamService
    {
        private readonly IUnitOfWork _uow;
        public TeamService(IUnitOfWork uow) { _uow = uow; }

        public async Task<List<TeamHistoryAPIViewModel>> GetMyTeamHistoryAsync(string accountId)
        {
            var myMemberships = await _uow.TeamMember.GetAllAsync(tm => tm.StudentId == accountId, includeProperties: "Team");

            var result = new List<TeamHistoryAPIViewModel>();

            foreach (var mem in myMemberships)
            {
                string eventName = "Unspecified";
                string eventId = mem.Team?.EventId;

                if (!string.IsNullOrEmpty(eventId))
                {
                    var eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == eventId);
                    if (eventDb != null)
                    {
                        eventName = eventDb.EventName;
                    }
                }

                result.Add(new TeamHistoryAPIViewModel
                {
                    TeamId = mem.TeamId,
                    TeamName = mem.Team?.TeamName,
                    IsLeader = mem.IsLeader,
                    EventId = eventId,
                    EventName = eventName
                });
            }
            return result;
        }

        public async Task<bool> CreateTeamAsync(string accountId, CreateTeamAPIViewModel request)
        {
            if (string.IsNullOrWhiteSpace(request.TeamName)) throw new Exception("Team name cant be empty");
            if (string.IsNullOrWhiteSpace(request.EventId)) throw new Exception("invalid eventID!");
            var student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == accountId);
            if (student == null || student.IsApproved == false)
                throw new Exception("Your account must be approved by an Admin before you can create a team!");
            string newTeamId = Guid.NewGuid().ToString();

            var newTeam = new Team
            {
                TeamId = newTeamId,
                TeamName = request.TeamName,
                EventId = request.EventId 
            };
            await _uow.Team.AddAsync(newTeam);

            var leaderMapping = new TeamMember
            {
                TeamId = newTeamId,
                StudentId = accountId,
                IsLeader = true,
                InviteStatus = true
            };
            await _uow.TeamMember.AddAsync(leaderMapping);

            await _uow.SaveAsync();
            return true;
        }



        public async Task<TeamDashboardAPIViewModel> GetMyTeamDashboardAsync(string accountId, string teamId)
        {
            var isMember = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);
            if (isMember == null) throw new Exception("You are not a member of this team.");

            var team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return null;

            string eventName = "Unspecified";
            if (!string.IsNullOrEmpty(team.EventId))
            {
                var eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == team.EventId);
                if (eventDb != null) eventName = eventDb.EventName;
            }

            string categoryName = "Chưa chọn đề tài";
            var submittedProject = await _uow.TeamInRound.GetFirstOrDefaultAsync(st => st.TeamId == teamId);

            if (submittedProject != null && !string.IsNullOrEmpty(submittedProject.TrackId))
            {
                var track = await _uow.Track.GetFirstOrDefaultAsync(c => c.TrackId == submittedProject.TrackId);
                if (track != null)
                {
                    categoryName = track.TrackName;
                    if (!string.IsNullOrEmpty(submittedProject.TopicId))
                    {
                        var topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == submittedProject.TopicId);
                        if (topic != null) categoryName += " - " + topic.TopicDetail;
                    }
                }
            }

            var allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            return new TeamDashboardAPIViewModel
            {
                TeamName = team.TeamName,
                EventName = eventName,
                CategoryName = categoryName,
                TotalMembers = memberCount
            };
        }

        public async Task<DateTime?> GetCountdownDeadlineAsync(string teamId)
        {
            var team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null || string.IsNullOrEmpty(team.EventId)) return null;

            var roundsInEvent = await _uow.Round.GetAllAsync(r => r.EventId == team.EventId);

            var activeRound = roundsInEvent
                .Where(r => r.EndDate > DateTime.Now)
                .OrderBy(r => r.EndDate)
                .FirstOrDefault();

            return activeRound?.EndDate; 
        }

        public async Task<bool> KickMemberAsync(string teamId, string memberToKickPlayerId, string requesterAccountId)
        {
            var requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            if (requester == null) throw new Exception("cant find player information");

            var leaderCheck = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);
            if (leaderCheck == null || leaderCheck.IsLeader == false)
                throw new Exception("only Team Leader allow to kick other players");

            if (requester.StudentId == memberToKickPlayerId)
                throw new Exception("you cant kick yourself, please transfer team leader to someone else");

            var memberToRemove = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == memberToKickPlayerId);
            if (memberToRemove == null) throw new Exception("member doesnt exist");

            _uow.TeamMember.Remove(memberToRemove);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> LeaveTeamAsync(string teamId, string requesterAccountId)
        {
            var requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            var memberRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);

            if (memberRecord == null) throw new Exception("You are not in this team.");

            var teamMembers = await _uow.TeamMember.GetAllAsync();
            var count = teamMembers.Count(ut => ut.TeamId == teamId);

            if (memberRecord.IsLeader == true)
            {
                if (count > 1)
                {
                    throw new Exception("You are the team leader. Please transfer the leader role to someone else before leaving.");
                }
                else
                {
                    var submittedRecord = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
                    if (submittedRecord != null) _uow.TeamInRound.Remove(submittedRecord);

                    _uow.TeamMember.Remove(memberRecord);

                    var teamToDelete = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
                    if (teamToDelete != null) _uow.Team.Remove(teamToDelete);

                    await _uow.SaveAsync();
                    return true;
                }
            }

            _uow.TeamMember.Remove(memberRecord);
            await _uow.SaveAsync();
            return true;
        }

        public async Task<bool> TransferLeaderRoleAsync(string teamId, string newLeaderPlayerId, string requesterAccountId)
        {
            var requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            if (requester == null) throw new Exception("Requester player profile not found!");

            if (requester.StudentId == newLeaderPlayerId)
                throw new Exception("You are already the leader of this team!");

            var currentLeaderRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);
            if (currentLeaderRecord == null || currentLeaderRecord.IsLeader == false)
                throw new Exception("Only the current Team Leader can transfer the leadership role!");

            var newLeaderRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == newLeaderPlayerId);
            if (newLeaderRecord == null) throw new Exception("The selected member is not currently in this team!");

            currentLeaderRecord.IsLeader = false;
            newLeaderRecord.IsLeader = true;

            _uow.TeamMember.Update(currentLeaderRecord);
            _uow.TeamMember.Update(newLeaderRecord);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> JoinTeamDirectlyAsync(string teamId, string requesterAccountId)
        {
            int MAX_TEAM_SIZE = 5;

            var requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            if (requester == null) throw new Exception("Player profile not found!");

            if (requester.IsApproved == false)
                throw new Exception("Your account must be approved by an Admin before you can join a team!");

            var targetTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (targetTeam == null) throw new Exception("The team does not exist!");

            var existingRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);
            if (existingRecord != null) throw new Exception("You are already a member of this team!");
            var targetTeamSubmission = await _uow.TeamInRound.GetFirstOrDefaultAsync(tir => tir.TeamId == teamId);
            if (targetTeamSubmission != null)
            {
                var targetRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == targetTeamSubmission.RoundId);

                var roundsInEvent = await _uow.Round.GetAllAsync(r => r.EventId == targetRound.EventId);
                var roundIdsInEvent = roundsInEvent.Select(r => r.RoundId).ToList();

                var allSubmissionsOfEvent = await _uow.TeamInRound.GetAllAsync(tir => roundIdsInEvent.Contains(tir.RoundId));
                var teamIdsInEvent = allSubmissionsOfEvent.Select(tir => tir.TeamId).ToList();

                var isAlreadyInEvent = await _uow.TeamMember.GetFirstOrDefaultAsync(tm =>
                    tm.StudentId == requesterAccountId &&
                    teamIdsInEvent.Contains(tm.TeamId)
                );

                if (isAlreadyInEvent != null)
                {
                    throw new Exception("Join failed! You are already in another team that is competing in the same event!");
                }
            }
            var allUserTeams = await _uow.TeamMember.GetAllAsync();
            var currentMemberCount = allUserTeams.Count(ut => ut.TeamId == teamId);

            if (currentMemberCount >= MAX_TEAM_SIZE)
                throw new Exception($"This team is already full! (Maximum {MAX_TEAM_SIZE} members allowed)");

            var newMember = new TeamMember
            {
                TeamId = teamId,
                StudentId = requester.StudentId,
                IsLeader = false,
                InviteStatus = true
            };

            await _uow.TeamMember.AddAsync(newMember);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> UpdateTeamInfoAsync(string accountId, string teamId, UpdateTeamAPIViewModel request)
        {
            var myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);

            if (myTeamInfo == null) throw new Exception("You are not in this team!");
            if (!myTeamInfo.IsLeader) throw new Exception("Only the Team Captain can change the team name.");

            var existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (existingSubmit != null) throw new Exception("Cannot change team name after locking the submission topic.");

            var teamToUpdate = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (teamToUpdate != null)
            {
                teamToUpdate.TeamName = request.TeamName;
                _uow.Team.Update(teamToUpdate);
                await _uow.SaveAsync();
                return true;
            }
            return false;
        }
        public async Task<List<TeamMemberAPIViewModel>> GetTeamMembersAsync(string teamId, string accountId)
        {
            var isMember = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.StudentId == accountId);
            if (isMember == null) throw new Exception("you are not allow to watch this team");

            var teamMembers = await _uow.Student.GetAllAsync(
                p => p.TeamMembers.Any(ut => ut.TeamId == teamId),
                includeProperties: "TeamMembers,StudentNavigation"); 

            var result = new List<TeamMemberAPIViewModel>();
            foreach (var member in teamMembers)
            {
                result.Add(new TeamMemberAPIViewModel
                {
                    StudentId = member.StudentId,
      
                    IsLeader = member.TeamMembers.FirstOrDefault(ut => ut.TeamId == teamId)?.IsLeader ?? false
                });
            }

            return result;
        }
    }
}