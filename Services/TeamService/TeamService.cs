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

        public async Task<List<TeamMemberAPIViewModel>> GetMyTeamAsync(string accountId)
        {
            var currentStudent = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == accountId, "TeamMembers");

            if (currentStudent == null || currentStudent.TeamMembers == null || !currentStudent.TeamMembers.Any())
            {
                return null;
            }

            string teamId = currentStudent.TeamMembers.FirstOrDefault().TeamId;

            var teamMembers = await _uow.Student.GetAllAsync(
                p => p.TeamMembers.Any(ut => ut.TeamId == teamId),
                includeProperties: "TeamMembers,Account");

            var result = new List<TeamMemberAPIViewModel>();
            foreach (var member in teamMembers)
            {
                result.Add(new TeamMemberAPIViewModel
                {
                    StudentId = member.StudentId,
                    Email = member.Account?.Email,
                    IsLeader = member.TeamMembers.FirstOrDefault(ut => ut.TeamId == teamId)?.IsLeader ?? false
                });
            }
            return result;
        }

        public async Task<bool> CreateTeamAsync(string accountId, string teamName)
        {
            if (string.IsNullOrWhiteSpace(teamName)) throw new Exception("Team name cannot be empty");

            var student = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == accountId, "TeamMembers");
            if (student == null) return false;

            if (student.TeamMembers != null && student.TeamMembers.Any()) return false;

            string newTeamId = Guid.NewGuid().ToString();

            var leaderMapping = new TeamMember
            {
                TeamId = newTeamId,
                StudentId = student.StudentId,
                IsLeader = true,
                InviteStatus = true
            };

            var newTeam = new Team
            {
                TeamId = newTeamId,
                TeamName = teamName,
                TeamMembers = new List<TeamMember> { leaderMapping }
            };

            await _uow.Team.AddAsync(newTeam);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<DateTime?> GetCountdownDeadlineAsync()
        {
            var rounds = await _uow.Round.GetAllAsync();
            var currentRound = rounds
                .Where(r => r.EndDate > DateTime.Now)
                .OrderBy(r => r.EndDate)
                .FirstOrDefault();

            return currentRound?.EndDate;
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

            var targetTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (targetTeam == null) throw new Exception("The team does not exist!");

            var existingRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);
            if (existingRecord != null) throw new Exception("You are already a member of this team!");

            var inAnotherTeam = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.StudentId == requester.StudentId);
            if (inAnotherTeam != null) throw new Exception("You are already in a team! Please leave your current team before joining a new one.");

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

        public async Task<TeamDashboardViewModel> GetMyTeamDashboardAsync(string accountId)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == accountId, "TeamMembers");
            if (student == null || student.TeamMembers == null || !student.TeamMembers.Any()) return null;

            string teamId = student.TeamMembers.FirstOrDefault().TeamId;

            var team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return null;

            string categoryName = "Not selected yet";
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
                        if (topic != null)
                        {
                            categoryName += " - " + topic.TopicDetail;
                        }
                    }
                }
            }

            var allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            return new TeamDashboardViewModel
            {
                TeamName = team.TeamName,
                CategoryName = categoryName,
                TotalMembers = memberCount
            };
        }

        public async Task<bool> UpdateTeamInfoAsync(string accountId, UpdateTeamAPIViewModel request)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == accountId, "TeamMembers");
            if (student == null || student.TeamMembers == null || !student.TeamMembers.Any())
                throw new Exception("You are not in any team!");

            var myTeamInfo = student.TeamMembers.FirstOrDefault();

            if (!myTeamInfo.IsLeader)
                throw new Exception("Only the Team Leader can update the team information.");

            var existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == myTeamInfo.TeamId);
            if (existingSubmit != null)
                throw new Exception("You cannot change the team name after submitting your project to the judges.");

            var teamToUpdate = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == myTeamInfo.TeamId);
            if (teamToUpdate != null)
            {
                teamToUpdate.TeamName = request.TeamName;
                _uow.Team.Update(teamToUpdate);
                await _uow.SaveAsync();
                return true;
            }

            return false;
        }
    }
}