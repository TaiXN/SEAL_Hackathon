using APIViewModels.Team;
using DataAccess.Repositories.TeamRepository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Services.TeamService;

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
        [HttpPost("create-team")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequestModel request)
        {
            try
            {
                // Lấy ID người dùng từ Token (Bắt theo NameIdentifier)
                string accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(accountId))
                {
                    return Unauthorized(new { message = "User information was not found in the Token." });
                }

                // Gọi hàm xử lý dưới Service
                bool isSuccess = await _team.CreateTeamAsync(accountId, request.TeamName, request.CategoryId, request.Description);

                if (isSuccess)
                {
                    return Ok(new { message = "created team successfully" });
                }
                else
                {
                    return BadRequest(new { message = "failed creating Team. you might be in a team already" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "SEVER ERROR: " + ex.Message });
            }
        }

        [HttpGet("my-team")]
        public async Task<IActionResult> GetMyTeam()
        {
            //FindFirst(...): read from token/cookie while GetFirstOrDefaultAsync read from DB
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(accountId))
                return Unauthorized("please sign up/sign in!");

            var teamList = await _team.GetMyTeamAsync(accountId);

            if (teamList == null)
            {

                return NotFound("you not in any team");
            }

            return Ok(teamList);
        }



        [HttpPost("submit-track")]
        public async Task<IActionResult> SubmitTrack(SubmitTrackAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    // 1. Get user ID from Token
                    string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                    if (string.IsNullOrEmpty(accountId))
                    {
                        return Unauthorized(new { message = "Please login first." });
                    }

                    // 2. Call Service - It will throw an Exception if rules are violated (e.g. < 3 members)
                    bool isSuccess = await _team.SubmitTrackAsync(accountId, info.CategoryID);

                    if (isSuccess)
                    {
                        return Ok(new { message = "Team track has been confirmed successfully!" });
                    }
                    else
                    {
                        return BadRequest(new { message = "Failed to confirm team track." });
                    }
                }
                catch (Exception ex)
                {
                    // 3. Catch the specific error from TeamService (e.g., "Your team must have at least 3 members...")
                    return BadRequest(new { message = ex.Message });
                }
            }

            return BadRequest(ModelState);
        }

        
        [HttpGet("countdown")]
        public async Task<IActionResult> GetCountdown()
        {
            try
            {
                var deadline = await _team.GetCountdownDeadlineAsync();

                if (deadline == null)
                {
                    // Trả về null nếu giải đấu đã kết thúc hết hoặc chưa có data
                    return Ok(new { message = "None event are happening.", deadline = (DateTime?)null });
                }

                // Trả về đúng cái mốc thời gian cho FE
                return Ok(new { deadline = deadline });
            }
            catch (Exception ex)
            {
                // Áp dụng luôn chiêu bắt lỗi tận gốc lúc nãy
                return StatusCode(500, new { message = $"SERVER ERROR: {ex.InnerException?.Message ?? ex.Message}" });
            }
        }

        [Authorize]
        [HttpDelete("{teamId}/kick/{memberPlayerId}")]
        public async Task<IActionResult> KickMember(string teamId, string memberPlayerId)
        {
            try
            {
                // Lấy AccountId của người đang đăng nhập (Leader) từ JWT Token
                string requesterAccountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(requesterAccountId)) return Unauthorized();

                // Gọi Service để xử lý
                await _team.KickMemberAsync(teamId, memberPlayerId, requesterAccountId);

                return Ok(new { message = "successfully kicked!" });
            }
            catch (Exception ex)
            {
                // Nhả ra câu chửi (Lỗi) nếu vi phạm 3 chốt chặn ở trên
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("{teamId}/transfer-leader/{newLeaderPlayerId}")]
        public async Task<IActionResult> TransferLeaderRole(string teamId, string newLeaderPlayerId)
        {
            try
            {
                // Extract AccountId from the current JWT token
                string requesterAccountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(requesterAccountId)) return Unauthorized();

                // Call the service to perform the role transfer
                await _team.TransferLeaderRoleAsync(teamId, newLeaderPlayerId, requesterAccountId);

                return Ok(new { message = "Leadership role has been successfully transferred!" });
            }
            catch (Exception ex)
            {
                // Return 400 Bad Request if any validation rule is violated
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("{teamId}/join-via-link")]
        public async Task<IActionResult> JoinTeamDirectly(string teamId)
        {
            try
            {
                // Extract AccountId from the current JWT token
                string requesterAccountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(requesterAccountId)) return Unauthorized();

                // Call the service to join the team directly
                await _team.JoinTeamDirectlyAsync(teamId, requesterAccountId);

                return Ok(new { message = "You have successfully joined the team!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [Authorize]
        [HttpGet("my-team-dashboard")]
        public async Task<IActionResult> GetMyTeamDashboard()
        {
            string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accountId)) return Unauthorized();

            var dashboardInfo = await _team.GetMyTeamDashboardAsync(accountId);

            if (dashboardInfo == null)
                return NotFound(new { message = "You are not in any team." });

            return Ok(dashboardInfo);
        }


    }

}
