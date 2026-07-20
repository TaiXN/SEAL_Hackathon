using APIViewModels.Event;
using APIViewModels.Track;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.TrackService;
using System.Security.Claims;

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
        public async Task<IActionResult> Create(CreateTrackAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accId)) return Unauthorized("Not found Admin.");

            bool isCreated = await _track.CreateTrackAsync(info, accId);

            if (isCreated) return Ok("Create track successfully");

            return BadRequest("Error while creating track");
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            List<TrackAPIViewModel> tracks = await _track.GetAllTracksAsync();
            return Ok(tracks);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid track ID.");

            TrackAPIViewModel currentTrack = await _track.GetTrackByIdAsync(id);
            if (currentTrack == null) return NotFound("No track found.");

            return Ok(currentTrack);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateTrackAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            bool isUpdated = await _track.UpdateTrackAsync(id, info);

            if (isUpdated) return Ok("Track update successful!");

            return BadRequest("Error occurred during the track update process or track not found.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid track ID.");

            bool isDeleted = await _track.DeleteTrackAsync(id);
            if (isDeleted) return Ok("Track successfully deleted.");

            return BadRequest("The track was not found, or an error occurred while deleting.");
        }

       
    }
}
