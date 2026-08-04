using APIViewModels.Event;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using System.Linq;

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
                };

                await _uow.Event.AddAsync(newEvent);
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
                    CurrentRound = e.CurrentRound
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
                    CurrentRound = e.CurrentRound
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
                Event result = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId.Equals(eventId));
                if (result == null) return false;

                result.IsActive = false;
                _uow.Event.Update(result);
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
                Event ev = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == eventId);
                if (ev == null) return (false, "Event does not exist.");

                Round round1 = await _uow.Round.GetFirstOrDefaultAsync(r => r.EventId == eventId && r.RoundIndex == 1);
                if (round1 == null) return (false, "Round 1 does not exist.");

                int teamCount = await _uow.TeamInRound.GetAllQueryable()
                                .Where(t =>
                                      t.RoundId == round1.RoundId &&
                                      t.IsCheck &&
                                      !t.IsBanned)
                                     .Select(t => t.TeamId)
                                     .Distinct()
                                     .CountAsync();

                if (teamCount < round1.MinTeam)
                {
                    return (false, $"Not enough teams to start Round 1. Minimum required: {round1.MinTeam} teams, currently registered: {teamCount} teams.");
                }

                ev.CurrentRound = 1;

                _uow.Event.Update(ev);
                await _uow.SaveAsync();

                return (true, "Registration closed. Round 1 has officially started!");
            }
            catch (Exception ex)
            {
                return (false, $"System error: {ex.Message}");
            }
        }

    }
}
