using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.MentorService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MentorController : ControllerBase
    {
        private readonly IMentorService _mentor;

        public MentorController(IMentorService mentor)
        {
            _mentor = mentor;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("track/{trackId}/mentor/{mentorId}")]
        public async Task<IActionResult> AddMentor(string mentorId, string trackId)
        {
            if (string.IsNullOrEmpty(mentorId) || string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Missing Mentor ID or Track ID.");
            }

            bool isAdded = await _mentor.AddMentor(mentorId, trackId);

            if (isAdded)
            {
                return Ok("Add mentor successfully!");
            }

            return BadRequest("Added fail. Mentor might already exist in this track.");
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("track/{trackId}")]
        public async Task<IActionResult> GetMentorsByTrack(string trackId)
        {
            if (string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Invalid track ID.");
            }

            List<TeacherList> mentors = await _mentor.GetMentorsByTrackAsync(trackId);

            if (mentors == null || mentors.Count == 0)
            {
                return NotFound("Empty mentor");
            }

            return Ok(mentors);
        }


        [Authorize(Roles = "Admin")]
        [HttpDelete("track/{trackId}/mentor/{mentorId}")]
        public async Task<IActionResult> RemoveMentor(string mentorId, string trackId)
        {
            if (string.IsNullOrEmpty(mentorId) || string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Please enter Mentor ID or Track ID.");
            }

            bool isRemoved = await _mentor.RemoveMentor(mentorId, trackId);

            if (isRemoved)
            {
                return Ok("Delete mentor successfully!");
            }

            return BadRequest("Error while deleting mentor.");
        }
    }
}
