using APIViewModels.Mentor;
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
        [HttpPost("track/{trackId}/teacher/{mentorId}")]
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
        [HttpGet]
        public async Task<IActionResult> GetAllMentors()
        {
            List<MentorAPIViewModel> mentors = await _mentor.GetAllMentorsAsync();

            if (mentors == null || mentors.Count == 0)
            {
                return NotFound("Empty mentor list.");
            }

            return Ok(mentors);
        }

       
        [Authorize(Roles = "Admin")]
        [HttpGet("track/{trackId}")]
        public async Task<IActionResult> GetMentorsByTrack(string trackId)
        {
            if (string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Invalid track ID.");
            }

            List<MentorAPIViewModel> mentors = await _mentor.GetMentorsByTrackAsync(trackId);

            if (mentors == null || mentors.Count == 0)
            {
                return NotFound("Empty mentor");
            }

            return Ok(mentors);
        }


        [Authorize(Roles = "Admin")]
        [HttpDelete("track/{trackId}/teacher/{mentorId}")]
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

        [HttpGet("assigned-teams/{mentorId}")]
        public async Task<IActionResult> GetAssignedTeams(string mentorId)
        {
            if (string.IsNullOrEmpty(mentorId))
            {
                return BadRequest("Please provide a valid Mentor ID.");
            }

            List<MentorAssignedTeamAPIViewModel> result = await _mentor.GetAssignedTeamsByMentorAsync(mentorId);

            if (result == null)
            {
                return NotFound($"Cannot find a Mentor with ID: {mentorId}, or this Mentor has not been assigned to any Track.");
            }

            return Ok(result);
        }

        [HttpGet("contact/{teamId}")]
        public async Task<IActionResult> GetMentorContact(string teamId)
        {
            if (string.IsNullOrEmpty(teamId)) return BadRequest("Invalid Team ID.");

            var result = await _mentor.GetMentorContactByTeamAsync(teamId);

            if (result == null)
                return NotFound("No mentor has been assigned to this team's track yet.");

            return Ok(result);
        }
    }
}
