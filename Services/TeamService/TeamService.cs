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
            List<TeamMember> myMemberships = await _uow.TeamMember.GetAllAsync(tm => tm.StudentId == accountId, includeProperties: "Team");
            List<TeamHistoryAPIViewModel> result = new List<TeamHistoryAPIViewModel>();

            foreach (TeamMember mem in myMemberships)
            {
                List<TeamInRound> teamSubmissions = await _uow.TeamInRound.GetAllAsync(tr => tr.TeamId == mem.TeamId);
                HashSet<string> uniqueEventIdsForTeam = new HashSet<string>();

                if (teamSubmissions.Any())
                {
                    foreach (TeamInRound sub in teamSubmissions)
                    {
                        Round round = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == sub.RoundId);
                        if (round != null && !uniqueEventIdsForTeam.Contains(round.EventId))
                        {
                            uniqueEventIdsForTeam.Add(round.EventId);
                            Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == round.EventId);

                            result.Add(new TeamHistoryAPIViewModel
                            {
                                TeamId = mem.TeamId,
                                TeamName = mem.Team?.TeamName,
                                IsLeader = mem.IsLeader,
                                EventId = eventDb?.EventId,
                                EventName = eventDb?.EventName ?? "Unspecified"
                            });
                        }
                    }
                }
                else
                {
                    result.Add(new TeamHistoryAPIViewModel
                    {
                        TeamId = mem.TeamId,
                        TeamName = mem.Team?.TeamName,
                        IsLeader = mem.IsLeader,
                        EventId = null,
                        EventName = "Unspecified"
                    });
                }
            }
            return result;
        }

        public async Task<bool> CreateTeamAsync(string accountId, CreateTeamAPIViewModel request)
        {
            if (string.IsNullOrWhiteSpace(request.TeamName)) throw new Exception("Team name cant be empty");

            Student student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == accountId);
            if (student == null || student.IsApproved == false)
                throw new Exception("Your account must be approved by an Admin before you can create a team!");

            string newTeamId = Guid.NewGuid().ToString();

            Team newTeam = new Team
            {
                TeamId = newTeamId,
                TeamName = request.TeamName
            };
            await _uow.Team.AddAsync(newTeam);

            TeamMember leaderMapping = new TeamMember
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

        //dashboard
        public async Task<TeamDashboardAPIViewModel> GetMyTeamDashboardAsync(string accountId, string teamId)
        {
            TeamMember isMember = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);
            if (isMember == null) throw new Exception("You are not a member of this team.");

            Team team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return null;

            string eventName = "You are not in an Event";
            string categoryName = "You haven't picked a topic";
            string currentRoundName = "Round hasn't started";
            int currentRoundIndex = -1;
            bool isEliminated = false;
            string statusMessage = "The event hasn't started yet.";

            List<TeamInRound> allTeamRounds = await _uow.TeamInRound.GetAllAsync(st => st.TeamId == teamId);
            TeamInRound submittedProject = null;
            Round highestTeamRound = null;

            foreach (TeamInRound tr in allTeamRounds)
            {
                Round r = await _uow.Round.GetFirstOrDefaultAsync(x => x.RoundId == tr.RoundId);
                if (r != null)
                {
                    if (highestTeamRound == null || r.EndDate > highestTeamRound.EndDate)
                    {
                        highestTeamRound = r;
                        submittedProject = tr;
                    }
                }
            }

            if (submittedProject != null && highestTeamRound != null)
            {
                if (!string.IsNullOrEmpty(submittedProject.TrackId))
                {
                    Track track = await _uow.Track.GetFirstOrDefaultAsync(c => c.TrackId == submittedProject.TrackId);
                    if (track != null)
                    {
                        categoryName = track.TrackName;
                        if (!string.IsNullOrEmpty(submittedProject.TopicId))
                        {
                            Topic topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == submittedProject.TopicId);
                            if (topic != null) categoryName += " - " + topic.TopicDetail;
                        }
                    }
                }

                Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == highestTeamRound.EventId);
                if (eventDb != null)
                {
                    eventName = eventDb.EventName;
                    currentRoundIndex = eventDb.CurrentRound;

                    DateTime vnNow = DateTime.UtcNow.AddHours(7);

                    Round activeRoundByTime = await _uow.Round.GetFirstOrDefaultAsync(r =>
                        r.EventId == eventDb.EventId &&
                        r.StartDate <= vnNow &&
                        r.EndDate >= vnNow);

                    if (activeRoundByTime != null)
                    {
                        currentRoundIndex = activeRoundByTime.RoundIndex;
                        currentRoundName = activeRoundByTime.RoundName;

                        if (eventDb.CurrentRound < currentRoundIndex)
                        {
                            eventDb.CurrentRound = currentRoundIndex;
                            _uow.Event.Update(eventDb);
                            await _uow.SaveAsync();
                        }
                    }
                    else
                    {
                        if (currentRoundIndex > 0)
                        {
                            Round activeEventRound = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == eventDb.EventId && r.RoundIndex == currentRoundIndex);
                            if (activeEventRound != null)
                            {
                                currentRoundName = activeEventRound.RoundName;
                            }
                        }
                    }

                    List<Round> allEventRounds = await _uow.Round.GetAllAsync(r => r.EventId == eventDb.EventId);
                    Round finalRound = allEventRounds.OrderByDescending(r => r.RoundIndex).FirstOrDefault();

                    bool isEventTotallyOver = finalRound != null && vnNow > finalRound.EndDate;

                    if (isEventTotallyOver)
                    {
                        currentRoundName = "Event Ended";
                        isEliminated = false;
                        statusMessage = "The event has concluded. Thank you for participating!";
                    }
                    else if (currentRoundIndex == -1)
                    {
                        currentRoundName = "Draft Stage";
                        isEliminated = false;
                        statusMessage = "This event is currently being configured by Admins.";
                    }
                    else if (currentRoundIndex == 0)
                    {
                        currentRoundName = "Registration Open";
                        isEliminated = false;
                        statusMessage = "The event hasn't started yet. Please wait for the first round to begin.";
                    }
                    else
                    {
                        if (highestTeamRound.RoundIndex < currentRoundIndex)
                        {
                            isEliminated = true;
                            statusMessage = $"You have been eliminated. You did not pass to {currentRoundName}.";
                        }
                        else
                        {
                            isEliminated = false;

                            if (currentRoundIndex == 1)
                            {
                                statusMessage = $"Welcome! You are actively competing in {currentRoundName}.";
                            }
                            else
                            {
                                statusMessage = $"Congratulations! You have been promoted and are competing in {currentRoundName}!";
                            }
                        }
                    }
                }

                if (submittedProject.IsBanned)
                {
                    isEliminated = true;
                    statusMessage = "Your team has been disqualified because a member's account was suspended for violating event rules.";
                }
            }

            int competitorsCount = 0;
            if (submittedProject != null)
            {
                var allTeamsInCurrentRound = await _uow.TeamInRound.GetAllAsync(tr => tr.RoundId == submittedProject.RoundId);
                competitorsCount = allTeamsInCurrentRound.Count();
            }
            // 

            List<TeamMember> allMembers = await _uow.TeamMember.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            return new TeamDashboardAPIViewModel
            {
                TeamName = team.TeamName,
                EventName = eventName,
                CategoryName = categoryName,
                TotalMembers = memberCount,
                CurrentRoundName = currentRoundName,
                CurrentRoundIndex = currentRoundIndex,
                IsEliminated = isEliminated,
                StatusMessage = statusMessage,
                TotalCompetitors = competitorsCount
            };
        }

        public async Task<DateTime?> GetCountdownDeadlineAsync(string teamId)
        {
            Team team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return null;

            TeamInRound submission = await _uow.TeamInRound.GetFirstOrDefaultAsync(tr => tr.TeamId == teamId);
            if (submission == null) return null;

            Round round = await _uow.Round.GetFirstOrDefaultAsync(r => r.RoundId == submission.RoundId);
            if (round == null) return null;

            List<Round> roundsInEvent = await _uow.Round.GetAllAsync(r => r.EventId == round.EventId);

            Round activeRound = roundsInEvent
                .Where(r => r.EndDate > DateTime.Now)
                .OrderBy(r => r.EndDate)
                .FirstOrDefault();

            return activeRound?.EndDate;
        }

        public async Task<bool> KickMemberAsync(string teamId, string memberToKickPlayerId, string requesterAccountId)
        {
            List<TeamMember> currentMembers = await _uow.TeamMember.GetAllAsync(tm => tm.TeamId == teamId);
            if (currentMembers.Count > 0)
            {
                List<string> memberIds = currentMembers.Select(m => m.StudentId).ToList();
                List<Account> memberAccounts = await _uow.Account.GetAllAsync(a => memberIds.Contains(a.AccountId));

                if (memberAccounts.Any(a => a.IsActive == false))
                {
                    throw new Exception("This team is paralyzed because one of its members has been banned. No team actions are allowed.");
                }
            }

            Student requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            if (requester == null) throw new Exception("cant find player information");

            TeamMember leaderCheck = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);
            if (leaderCheck == null || leaderCheck.IsLeader == false)
                throw new Exception("only Team Leader allow to kick other players");

            if (requester.StudentId == memberToKickPlayerId)
                throw new Exception("you cant kick yourself, please transfer team leader to someone else");

            TeamMember memberToRemove = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == memberToKickPlayerId);
            if (memberToRemove == null) throw new Exception("member doesnt exist");

            _uow.TeamMember.Remove(memberToRemove);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> LeaveTeamAsync(string teamId, string requesterAccountId)
        {
            List<TeamMember> currentMembers = await _uow.TeamMember.GetAllAsync(tm => tm.TeamId == teamId);
            if (currentMembers.Count > 0)
            {
                List<string> memberIds = currentMembers.Select(m => m.StudentId).ToList();
                List<Account> memberAccounts = await _uow.Account.GetAllAsync(a => memberIds.Contains(a.AccountId));

                if (memberAccounts.Any(a => a.IsActive == false))
                {
                    throw new Exception("This team is paralyzed because one of its members has been banned. No team actions are allowed.");
                }
            }

            Student requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            TeamMember memberRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);

            if (memberRecord == null) throw new Exception("You are not in this team.");

            TeamInRound submittedRecord = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (submittedRecord != null)
            {
                throw new Exception("You cannot leave the team because your team is already locked in for the competition.");
            }

            List<TeamMember> teamMembers = await _uow.TeamMember.GetAllAsync();
            int count = teamMembers.Count(ut => ut.TeamId == teamId);

            if (memberRecord.IsLeader == true)
            {
                if (count > 1)
                {
                    throw new Exception("You are the team leader. Please transfer the leader role to someone else before leaving.");
                }
                else
                {
                    _uow.TeamMember.Remove(memberRecord);

                    Team teamToDelete = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
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
            List<TeamMember> currentMembers = await _uow.TeamMember.GetAllAsync(tm => tm.TeamId == teamId);
            if (currentMembers.Count > 0)
            {
                List<string> memberIds = currentMembers.Select(m => m.StudentId).ToList();
                List<Account> memberAccounts = await _uow.Account.GetAllAsync(a => memberIds.Contains(a.AccountId));

                if (memberAccounts.Any(a => a.IsActive == false))
                {
                    throw new Exception("This team is paralyzed because one of its members has been banned. No team actions are allowed.");
                }
            }

            Student requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            if (requester == null) throw new Exception("Requester player profile not found!");

            if (requester.StudentId == newLeaderPlayerId)
                throw new Exception("You are already the leader of this team!");

            TeamMember currentLeaderRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requester.StudentId);
            if (currentLeaderRecord == null || currentLeaderRecord.IsLeader == false)
                throw new Exception("Only the current Team Leader can transfer the leadership role!");

            TeamMember newLeaderRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == newLeaderPlayerId);
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

            Student requester = await _uow.Student.GetFirstOrDefaultAsync(p => p.StudentId == requesterAccountId);
            if (requester == null || requester.IsApproved == false)
                throw new Exception("invalid account to join, please wait for admin to approve your account");

            Team targetTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (targetTeam == null) throw new Exception("team doesnt exist");

            TeamInRound isTeamLocked = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (isTeamLocked != null)
                throw new Exception("This team is already locked for the competition. New members cannot join.");

            TeamMember existingRecord = await _uow.TeamMember.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.StudentId == requesterAccountId);
            if (existingRecord != null) throw new Exception("u already in this team");

            List<TeamMember> allUserTeams = await _uow.TeamMember.GetAllAsync();
            if (allUserTeams.Count(ut => ut.TeamId == teamId) >= MAX_TEAM_SIZE)
                throw new Exception($"team is full: {MAX_TEAM_SIZE} people, unable to join!");

            TeamMember newMember = new TeamMember
            {
                TeamId = teamId,
                StudentId = requesterAccountId,
                IsLeader = false,
                InviteStatus = true
            };

            await _uow.TeamMember.AddAsync(newMember);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> UpdateTeamInfoAsync(string accountId, string teamId, UpdateTeamAPIViewModel request)
        {
            List<TeamMember> currentMembers = await _uow.TeamMember.GetAllAsync(tm => tm.TeamId == teamId);
            if (currentMembers.Count > 0)
            {
                List<string> memberIds = currentMembers.Select(m => m.StudentId).ToList();
                List<Account> memberAccounts = await _uow.Account.GetAllAsync(a => memberIds.Contains(a.AccountId));

                if (memberAccounts.Any(a => a.IsActive == false))
                {
                    throw new Exception("This team is paralyzed because one of its members has been banned. No team actions are allowed.");
                }
            }

            TeamMember myTeamInfo = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.StudentId == accountId && tm.TeamId == teamId);

            if (myTeamInfo == null) throw new Exception("You are not in this team!");
            if (!myTeamInfo.IsLeader) throw new Exception("Only the Team Captain can change the team name.");

            TeamInRound existingSubmit = await _uow.TeamInRound.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (existingSubmit != null) throw new Exception("Cannot change team name after locking the submission topic.");

            Team teamToUpdate = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
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
            TeamMember isMember = await _uow.TeamMember.GetFirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.StudentId == accountId);
            if (isMember == null) throw new Exception("You are not allowed to view this team's members.");

            List<Student> teamMembers = await _uow.Student.GetAllAsync(
                p => p.TeamMembers.Any(ut => ut.TeamId == teamId),
                includeProperties: "TeamMembers,StudentNavigation");

            List<TeamMemberAPIViewModel> result = new List<TeamMemberAPIViewModel>();
            foreach (Student member in teamMembers)
            {
                result.Add(new TeamMemberAPIViewModel
                {
                    StudentId = member.StudentId,
                    StudentName = member.StudentNavigation?.FullName ?? "Unknown",
                    IsLeader = member.TeamMembers.FirstOrDefault(ut => ut.TeamId == teamId)?.IsLeader ?? false,
                    IsActive = member.StudentNavigation?.IsActive ?? false
                });
            }

            return result;
        }

    }
}