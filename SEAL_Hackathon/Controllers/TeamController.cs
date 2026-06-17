using APIViewModels.Team;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.TeamService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _team;

        public TeamController(ITeamService team)
        {
            _team = team;
        }

        [HttpGet("my-teams-history")]
        public async Task<IActionResult> GetMyTeamHistory()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized("please sign up/sign in!");

            var teamList = await _team.GetMyTeamHistoryAsync(accountId);

            if (teamList == null || !teamList.Any())
                return Ok(new { message = "You haven't joined any teams yet.", data = teamList });

            return Ok(new { data = teamList });
        }

        [HttpPost("create-team")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(accountId))
                {
                    return Unauthorized(new { message = "User information was not found in the Token." });
                }

                bool isSuccess = await _team.CreateTeamAsync(accountId, request);

                if (isSuccess)
                {
                    return Ok(new { message = "Created team successfully" });
                }
                else
                {
                    return BadRequest(new { message = "Failed creating Team." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"SERVER ERROR: {ex.InnerException?.Message ?? ex.Message}" });
            }
        }

        [HttpGet("{teamId}/dashboard")]
        public async Task<IActionResult> GetTeamDashboard(string teamId)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                var dashboardInfo = await _team.GetMyTeamDashboardAsync(accountId, teamId);

                if (dashboardInfo == null)
                    return NotFound(new { message = "Team not found or you are not authorized to view it." });

                return Ok(dashboardInfo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{teamId}/countdown")]
        public async Task<IActionResult> GetCountdown(string teamId)
        {
            try
            {
                var deadline = await _team.GetCountdownDeadlineAsync(teamId);

                if (deadline == null)
                    return Ok(new { message = "No active rounds at the moment.", deadline = (DateTime?)null });

                return Ok(new { deadline = deadline });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"SERVER ERROR: {ex.InnerException?.Message ?? ex.Message}" });
            }
        }

        [HttpDelete("{teamId}/kick/{memberPlayerId}")]
        public async Task<IActionResult> KickMember(string teamId, string memberPlayerId)
        {
            try
            {
                string requesterAccountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(requesterAccountId)) return Unauthorized();

                await _team.KickMemberAsync(teamId, memberPlayerId, requesterAccountId);
                return Ok(new { message = "Successfully kicked!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{teamId}/transfer-leader/{newLeaderPlayerId}")]
        public async Task<IActionResult> TransferLeaderRole(string teamId, string newLeaderPlayerId)
        {
            try
            {
                string requesterAccountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(requesterAccountId)) return Unauthorized();

                await _team.TransferLeaderRoleAsync(teamId, newLeaderPlayerId, requesterAccountId);
                return Ok(new { message = "Leadership role has been successfully transferred!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{teamId}/join-via-link")]
        public async Task<IActionResult> JoinTeamDirectly(string teamId)
        {
            try
            {
                string requesterAccountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(requesterAccountId)) return Unauthorized();

                await _team.JoinTeamDirectlyAsync(teamId, requesterAccountId);
                return Ok(new { message = "You have successfully joined the team!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("{teamId}/update-info")]
        public async Task<IActionResult> UpdateTeamInfo(string teamId, [FromBody] UpdateTeamAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _team.UpdateTeamInfoAsync(accountId, teamId, request);
                if (isSuccess)
                {
                    return Ok(new { message = "Team information updated successfully!" });
                }
                return BadRequest(new { message = "Could not update team information." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{teamId}/leave")]
        public async Task<IActionResult> LeaveTeam(string teamId)
        {
            try
            {
                string requesterAccountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(requesterAccountId))
                    return Unauthorized(new { message = "User information not found." });

                await _team.LeaveTeamAsync(teamId, requesterAccountId);
                return Ok(new { message = "You have successfully left the team!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{teamId}/members")]
        public async Task<IActionResult> GetTeamMembers(string teamId)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                var members = await _team.GetTeamMembersAsync(teamId, accountId);
                return Ok(members);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}