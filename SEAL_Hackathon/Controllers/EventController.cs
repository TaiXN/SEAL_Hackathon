using APIViewModels.Event;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.AdminService;
using Services.EventService;
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
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accId)) return Unauthorized("Not found Admin.");

            bool isCreated = await _event.CreateEventAsync(info, accId);

            if (isCreated) return Ok("Create event successfully");

            return BadRequest("Error while creating event");
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
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid event ID.");

            var currentEvent = await _event.GetEventByIdAsync(id);
            if (currentEvent == null) return NotFound("No event found.");

            return Ok(currentEvent);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateEventAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            bool isUpdated = await _event.UpdateEventAsync(id, info);

            if (isUpdated) return Ok("Event update successful!");

            return BadRequest("Error occurred during the event update process or event not found.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid event ID.");

            bool isDeleted = await _event.DeleteEventAsync(id);
            if (isDeleted) return Ok("Event successfully deleted.");

            return BadRequest("The event was not found, or an error occurred while deleting.");
        }
    }
}
