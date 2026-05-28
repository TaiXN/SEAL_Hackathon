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

        public async Task<bool> CreateEventAsync(Event newEvent)
        {
            try
            {
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

        public async Task<bool> UpdateEventAsync(Event eventToUpdate)
        {
            try
            {      
                _uow.Event.Update(eventToUpdate);
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
