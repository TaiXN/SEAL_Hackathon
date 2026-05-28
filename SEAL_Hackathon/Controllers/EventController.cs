using APIViewModels.Admin;
using APIViewModels.Event;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.AccountService;
using Services.AdminService;
using Services.EventService;
using Services.RoleService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly IEventService _event;
        private readonly IAdminService _admin;
        public EventController(IEventService events, IAdminService admin)
        {
            _event = events;
            _admin = admin;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateEventAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                DataAccess.Entities.Event newEvent = new DataAccess.Entities.Event()
                {
                    EventId = Guid.NewGuid().ToString(),
                    Creator = accId,
                    EventName = info.EventName,
                    Season = info.Season,
                    Year = info.Year,
                    IsActive = true,
                    IsDiqualified = false,
                    DisqualifyReason = info.DisqualifyReason,
                };
                bool isCreated = await _event.CreateEventAsync(newEvent);
                if (isCreated)
                {
                    return Ok("Create event successfully");
                }
                else
                {
                    return BadRequest("Error while creating event");
                }

            }
            else
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var events = await _event.GetAllEventsAsync();
            return Ok(events);
        }

        [Authorize(Roles = "Admin")] 
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Invalid event ID.");
            }

            var currentEvent = await _event.GetEventByIdAsync(id);

            if (currentEvent == null)
            {
                return NotFound("No event found.");
            }

            return Ok(currentEvent);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateEventAPIViewModel info)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingEvent = await _event.GetEventByIdAsync(id);
            if (existingEvent == null)
            {
                return NotFound("No event found to update.");
            }

            existingEvent.EventName = info.EventName;
            existingEvent.Season = info.Season;
            existingEvent.Year = info.Year;
            existingEvent.DisqualifyReason = info.DisqualifyReason;

            bool isUpdated = await _event.UpdateEventAsync(existingEvent);

            if (isUpdated)
            {
                return Ok("Event update successful!");
            }

            return BadRequest("Error occurred during the event update process.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Invalid event ID.");
            }

            bool isDeleted = await _event.DeleteEventAsync(id);

            if (isDeleted)
            {
                return Ok("Event successfully deleted.");
            }

            return BadRequest("The event was not found, or an error occurred while deleting.");
        }
    }
}
