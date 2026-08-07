using APIViewModels.Admin;
using APIViewModels.Event;
using APIViewModels.Team;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Services.EventService
{
    public class EventService : IEventService
    {
        private readonly IUnitOfWork _uow;
        public EventService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateEventAsync(CreateEventAPIViewModel info, string accId)
        {
            try
            {
                DateTime vnNow = DateTime.UtcNow.AddHours(7);
                DateTime regStartVn = info.RegistrationStartDate.ToUniversalTime().AddHours(7);
                DateTime regEndVn = info.RegistrationEndDate.ToUniversalTime().AddHours(7);

                if (regStartVn >= regEndVn)
                {
                    return false;
                }

                if (regStartVn < vnNow)
                {
                    return false;
                }

                if (info.MinTeamMember <= 0 || info.MaxTeamMember <= 0 || info.MinTeamMember > info.MaxTeamMember)
                {
                    return false;
                }

                Event duplicateCheck = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventName.ToLower() == info.EventName.ToLower() && e.IsActive);

                if (duplicateCheck != null)
                {
                    return false;
                }

                Event newEvent = new Event()
                {
                    EventId = Guid.NewGuid().ToString(),
                    Creator = accId,
                    EventName = info.EventName,
                    Season = info.Season,
                    Year = info.Year,
                    IsActive = true,
                    CurrentRound = -1,
                    RegistrationStartDate = regStartVn,
                    RegistrationEndDate = regEndVn,
                    MinTeamMember = info.MinTeamMember,
                    MaxTeamMember = info.MaxTeamMember
                };

                await _uow.Event.AddAsync(newEvent);

                if (info.Prizes != null && info.Prizes.Count > 0)
                {
                    List<Prize> newPrizes = new List<Prize>();
                    foreach (EventPrizeViewModel p in info.Prizes)
                    {
                        Prize newPrize = new Prize
                        {
                            PrizeId = Guid.NewGuid().ToString(),
                            PrizeName = p.PrizeName,
                            Description = p.Description,
                            EventId = newEvent.EventId,
                            IsActive = true,
                            TeamId = null,
                            RankIndex = p.RankIndex
                        };
                        newPrizes.Add(newPrize);
                    }
                    await _uow.Prize.AddRangeAsync(newPrizes);
                }

                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> NextRound(string eventID)
        {
            try
            {
                Event currentEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == eventID && e.IsActive);
                if (currentEvent == null)
                {
                    return false;
                }

                int nextRoundIndex = currentEvent.CurrentRound + 1;

                Round nextRound = await _uow.Round.GetFirstOrDefaultAsync(e => e.EventId == currentEvent.EventId && e.RoundIndex == nextRoundIndex);
                if (nextRound != null)
                {
                    currentEvent.CurrentRound = nextRoundIndex;
                    _uow.Event.Update(currentEvent);
                    await _uow.SaveAsync();
                    return true;
                }
                else
                {
                    return false;
                }
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<EventAPIViewModel>> GetAllEventsAsync()
        {
            try
            {
                List<Event> result = await _uow.Event.GetAllAsync();


                return result.Select(e => new EventAPIViewModel
                {
                    EventId = e.EventId,
                    Creator = e.Creator,
                    EventName = e.EventName,
                    Season = e.Season,
                    Year = e.Year,
                    IsActive = e.IsActive,
                    CurrentRound = e.CurrentRound,
                    MinTeamMember = e.MinTeamMember,
                    MaxTeamMember = e.MaxTeamMember,
                    RegistrationStartDate = e.RegistrationStartDate,
                    RegistrationEndDate = e.RegistrationEndDate,

                }).ToList();
            }
            catch
            {
                return new List<EventAPIViewModel>();
            }
        }

        public async Task<EventAPIViewModel> GetEventByIdAsync(string eventId)
        {
            try
            {
                Event e = await _uow.Event.GetFirstOrDefaultAsync(ev => ev.EventId == eventId);
                if (e == null) return null;

                return new EventAPIViewModel
                {
                    EventId = e.EventId,
                    Creator = e.Creator,
                    EventName = e.EventName,
                    Season = e.Season,
                    Year = e.Year,
                    IsActive = e.IsActive,
                    CurrentRound = e.CurrentRound,
                    MinTeamMember = e.MinTeamMember,
                    MaxTeamMember = e.MaxTeamMember,
                    RegistrationStartDate = e.RegistrationStartDate,
                    RegistrationEndDate = e.RegistrationEndDate,

                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateEventAsync(string id, UpdateEventAPIViewModel info)
        {
            try
            {
                DateTime regStartVn = info.RegistrationStartDate.ToUniversalTime().AddHours(7);
                DateTime regEndVn = info.RegistrationEndDate.ToUniversalTime().AddHours(7);

                if (regStartVn >= regEndVn)
                {
                    return false;
                }

                Event eventDb = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == id);
                if (eventDb == null) return false;

                Event duplicateCheck = await _uow.Event.GetFirstOrDefaultAsync(e =>
                    e.EventName.ToLower() == info.EventName.ToLower() &&
                    e.EventId != id &&
                    e.IsActive);

                if (duplicateCheck != null)
                {
                    return false;
                }

                if (eventDb.CurrentRound == -1)
                {
                    if (info.MinTeamMember <= 0 || info.MaxTeamMember <= 0 || info.MinTeamMember > info.MaxTeamMember)
                    {
                        return false;
                    }

                    eventDb.MinTeamMember = info.MinTeamMember;
                    eventDb.MaxTeamMember = info.MaxTeamMember;
                }

                eventDb.EventName = info.EventName;
                eventDb.Season = info.Season;
                eventDb.Year = info.Year;
                eventDb.CurrentRound = info.CurrentRound;
                eventDb.RegistrationStartDate = regStartVn;
                eventDb.RegistrationEndDate = regEndVn;

                _uow.Event.Update(eventDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<bool> DeleteEventAsync(string eventId)
        {
            try
            {
                Event eventDb =
                    await _uow.Event.GetFirstOrDefaultAsync(
                        e => e.EventId == eventId &&
                             e.IsActive);

                if (eventDb == null)
                {
                    return false;
                }

                if (eventDb.CurrentRound > 0)
                {
                    return false;
                }

                eventDb.IsActive = false;

                _uow.Event.Update(eventDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<(bool IsSuccess, string Message)> PublishEventAsync(string eventId)
        {
            try
            {
                Event ev = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == eventId);
                if (ev == null) return (false, "Event does not exist.");

                List<Round> eventRounds = await _uow.Round.GetAllQueryable()
                                              .Where(r => r.EventId == eventId && r.IsActive)
                                              .OrderBy(r => r.RoundIndex)
                                              .ToListAsync();

                if (eventRounds.Count == 0)
                {
                    return (false, "This event has no round configuration. Please create at least Round 1 before publishing.");
                }

                Round round1 = eventRounds.FirstOrDefault(r => r.RoundIndex == 1);
                if (round1 == null)
                {
                    return (false, "Round 1 has not been configured.");
                }

                if (round1.MinTeam <= 0 || round1.MaxTeam <= 0 || round1.MinTeam > round1.MaxTeam)
                {
                    return (false, "Round 1 team configuration is invalid.");
                }

                ev.CurrentRound = 0;

                _uow.Event.Update(ev);
                await _uow.SaveAsync();

                return (true, "Event published and registration form opened successfully!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<(bool IsSuccess, string Message)> StartRound1Async(string eventId)
        {
            try
            {
                Event ev = await _uow.Event
                    .GetFirstOrDefaultAsync(e => e.EventId == eventId);

                if (ev == null)
                    return (false, "Event does not exist.");

                if (ev.CurrentRound != 0)
                {
                    return (false, "Event is not currently in registration phase.");
                }

                Round round1 = await _uow.Round
                    .GetFirstOrDefaultAsync(r =>
                        r.EventId == eventId &&
                        r.RoundIndex == 1);

                if (round1 == null)
                    return (false, "Round 1 does not exist.");

                int teamCount = await _uow.TeamInRound
                    .GetAllQueryable()
                    .Where(t =>
                        t.RoundId == round1.RoundId &&
                        t.IsCheck &&
                        !t.IsBanned)
                    .Select(t => t.TeamId)
                    .Distinct()
                    .CountAsync();

                if (teamCount < round1.MinTeam)
                {
                    return (
                        false,
                        $"Not enough teams to start Round 1. " +
                        $"Minimum required: {round1.MinTeam}, " +
                        $"currently approved: {teamCount}."
                    );
                }

                ev.CurrentRound = 1;

                _uow.Event.Update(ev);
                await _uow.SaveAsync();

                return (
                    true,
                    "Registration closed. Round 1 has officially started!"
                );
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

        public async Task<List<AdminTeamJoinedAPIViewModel>> GetTeamsJoinedEventAsync(string eventId)
        {
            List<string> roundIds = await _uow.Round.GetAllQueryable()
                                            .Where(r => r.EventId == eventId)
                                            .Select(r => r.RoundId)
                                            .ToListAsync();

            if (!roundIds.Any())
            {
                return new List<AdminTeamJoinedAPIViewModel>();
            }

            List<TeamInRound> joinedTeams = await _uow.TeamInRound.GetAllQueryable()
                                                .Include(t => t.Team)
                                                .Include(t => t.Track)
                                                .Where(t => roundIds.Contains(t.RoundId))
                                                .ToListAsync();

            List<TeamInRound> uniqueTeams = joinedTeams
                                                .GroupBy(t => t.TeamId)
                                                .Select(g => g.FirstOrDefault())
                                                .ToList();

            List<AdminTeamJoinedAPIViewModel> result = new List<AdminTeamJoinedAPIViewModel>();

            foreach (TeamInRound tr in uniqueTeams)
            {
                string topicName = "Topic not selected";
                if (!string.IsNullOrEmpty(tr.TopicId))
                {
                    Topic topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == tr.TopicId);
                    if (topic != null) topicName = topic.TopicDetail;
                }

                List<Student> teamStudents = await _uow.Student.GetAllQueryable()
                    .Include(s => s.TeamMembers)
                    .Include(s => s.StudentNavigation)
                    .Where(s => s.TeamMembers.Any(tm => tm.TeamId == tr.TeamId))
                    .ToListAsync();

                List<TeamMemberAPIViewModel> membersList = new List<TeamMemberAPIViewModel>();

                foreach (Student student in teamStudents)
                {
                    membersList.Add(new TeamMemberAPIViewModel
                    {
                        StudentId = student.StudentId,
                        StudentName = student.StudentNavigation?.FullName ?? "Unknown",
                        IsLeader = student.TeamMembers.FirstOrDefault(tm => tm.TeamId == tr.TeamId)?.IsLeader ?? false,
                        IsActive = student.StudentNavigation?.IsActive ?? false
                    });
                }

                membersList = membersList.OrderByDescending(m => m.IsLeader).ToList();

                result.Add(new AdminTeamJoinedAPIViewModel
                {
                    TeamId = tr.TeamId,
                    TeamName = tr.Team != null ? tr.Team.TeamName : "Unknown Team",
                    TrackName = tr.Track != null ? tr.Track.TrackName : "Track not selected",
                    TopicName = topicName,
                    TotalMembers = membersList.Count, 
                    IsBanned = tr.IsBanned,
                    Members = membersList 
                });
            }

            return result;
        }

    }
}
