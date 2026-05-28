using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.EventService
{
    public interface IEventService
    {
        Task<bool> CreateEventAsync(Event newEvent);
        Task<List<Event>> GetAllEventsAsync();
        Task<Event> GetEventByIdAsync(string eventId);
        Task<bool> UpdateEventAsync(Event eventToUpdate);
        Task<bool> DeleteEventAsync(string eventId);
    }
}
