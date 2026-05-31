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



        [HttpPost("submit-track")] //tao link

        public async Task<IActionResult> SubmitTrack(SubmitTrackAPIViewModel info)
        {
            if (ModelState.IsValid)
            { // kiem tra du lieu 
                //ClaimTypes.NameIdentifier: Dòng chứa ID của người dùng" (Tương đương với cái chữ NameId lúc tạo thẻ).
                // ==> find id and give id to accountID
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(accountId))
                {
                    return Unauthorized("please login");
                }

                bool isSuccess = await _team.SubmitTrackAsync(accountId, info.CategoryID);//lum trong teamService
                if (isSuccess)
                {
                    return Ok("Team track has been confirmed");
                }
                else
                {
                    return BadRequest("ERROR: cannot find team, or not you dont have permission");
                }
            }

            return BadRequest(ModelState);// exception error }
        }

        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard()
        {
            try
            {
                var result = await _team.GetLeaderboardAsync();
                return Ok(result); 
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
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


    }

}
