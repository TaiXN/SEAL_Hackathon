using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.DropdownService;
using System;
using System.Threading.Tasks;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DropdownController : ControllerBase
    {
        private readonly IDropdownService _dropdownService;

        public DropdownController(IDropdownService dropdownService)
        {
            _dropdownService = dropdownService;
        }

        [HttpGet("active-events")]
        [Authorize]
        public async Task<IActionResult> GetActiveEvents()
        {
            try
            {
                var result = await _dropdownService.GetActiveEventsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tracks-by-event/{eventId}")]
        [Authorize]
        public async Task<IActionResult> GetTracksByEvent(string eventId)
        {
            try
            {
                var result = await _dropdownService.GetTracksByEventAsync(eventId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("topics-by-track/{trackId}")]
        [Authorize]
        public async Task<IActionResult> GetTopicsByTrack(string trackId)
        {
            try
            {
                var result = await _dropdownService.GetTopicsByTrackAsync(trackId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
