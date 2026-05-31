using APIViewModels.Event;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
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
                Event newEvent = new Event()
                {
                    EventId = Guid.NewGuid().ToString(),
                    Creator = accId,
                    EventName = info.EventName,
                    Season = info.Season,
                    Year = info.Year,
                    IsActive = true,
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

        public async Task<List<Event>> GetAllEventsAsync()
        {
            try
            {
                var result = await _uow.Event.GetAllAsync();
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
                var existingEvent = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId == id);
                if (existingEvent == null) return false;

                existingEvent.EventName = info.EventName;
                existingEvent.Season = info.Season;
                existingEvent.Year = info.Year;

                _uow.Event.Update(existingEvent);
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
                var ev = await _uow.Event.GetFirstOrDefaultAsync(e => e.EventId.Equals(eventId));
                if (ev == null) return false;

                ev.IsActive = false;
                _uow.Event.Update(ev);
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
