using APIViewModels.Event;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
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
                    CurrentRound = 0,
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
                if(currentEvent == null)
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

        public async Task<List<Event>> GetAllEventsAsync()
        {
            try
            {
                List<Event> result = await _uow.Event.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Event>();
            }
        }

        public async Task<Event> GetEventByIdAsync(string eventId)
        {
            try
            {
                return await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == eventId);
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

    }
}
