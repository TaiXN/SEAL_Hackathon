using DataAccess.Entities;
using APIViewModels.Event;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.EventService
{
    public interface IEventService
    {
        Task<bool> CreateEventAsync(CreateEventAPIViewModel info, string accId);
        Task<List<EventAPIViewModel>> GetAllEventsAsync();
        Task<EventAPIViewModel> GetEventByIdAsync(string eventId);
        Task<bool> UpdateEventAsync(string id, UpdateEventAPIViewModel info);
        Task<bool> DeleteEventAsync(string eventId);
        Task<bool> NextRound(string eventID);
    }
}
