using APIViewModels.Event;
using APIViewModels.Track;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.TrackService;
using System.Security.Claims;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrackController : ControllerBase
    {
        private readonly ITrackService _track;

        public TrackController(ITrackService track)
        {
            _track = track;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateTrack(CreateTrackAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accId)) return Unauthorized("Not found Admin.");

            (bool IsSuccess, string Message) result = await _track.CreateTrackAsync(info, accId);
            if (result.IsSuccess)
            {
                return Ok(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllTrack()
        {
            List<TrackAPIViewModel> result = await _track.GetAllTracksAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTrackById(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid track ID.");

            TrackAPIViewModel result = await _track.GetTrackByIdAsync(id);
            if (result == null)
            {
                return NotFound(new { message = "No track found." });
            }
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTrack(string id, UpdateTrackAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            (bool IsSuccess, string Message) result = await _track.UpdateTrackAsync(id, info);
            if (result.IsSuccess)
            {
                return Ok(new { message = result.Message });
            }
            return BadRequest(new { message = result.Message });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrack(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid track ID.");

            bool isSuccess = await _track.DeleteTrackAsync(id);
            if (isSuccess)
            {
                return Ok(new { message = "Track successfully deleted." });
            }
            return BadRequest(new { message = "The track was not found, or an error occurred while deleting." });
        }

    }
}