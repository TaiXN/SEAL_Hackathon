using APIViewModels.TeamProject;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.TeamInRoundService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamInRoundController : ControllerBase
    {
        private readonly ITeamInRoundService _teamInRoundService;

        public TeamInRoundController(ITeamInRoundService teamInRoundService)
        {
            _teamInRoundService = teamInRoundService;
        }

        [HttpPost("{teamId}/create")]
        public async Task<IActionResult> SubmitProject(string teamId, [FromBody] SubmitProjectAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _teamInRoundService.CreateTeamInRoundAsync(accountId, teamId, request);
                if (isSuccess)
                {
                    return Ok(new { message = " Created successfully!" });
                }
                return BadRequest(new { message = "Cannot create ." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }


        [HttpPut("approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveTeam(string id)
        {
            bool isSuccess = await _teamInRoundService.CheckTeamInRoundAsync(id);
            if (isSuccess)
                return Ok("Team has been successfully checked.");

            return BadRequest("Failed to approve team. Team ID not found.");
        }

       
        [HttpPut("ban/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BanTeam(string id)
        {
            bool isSuccess = await _teamInRoundService.BanTeamInRoundAsync(id);
            if (isSuccess)
                return Ok("Team has been successfully banned.");

            return BadRequest("Failed to ban team. Team ID not found.");
        }

        [HttpPut("unban/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnbanTeam(string id)
        {
            bool isSuccess = await _teamInRoundService.UnbanTeamInRoundAsync(id);
            if (isSuccess)
                return Ok("Team has been successfully unbanned.");

            return BadRequest("Failed to unban team. Team ID not found.");
        }
    }
}

