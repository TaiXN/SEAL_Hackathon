using APIViewModels.TeamProject;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.SubmittedTeamService;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubmittedTeamController : ControllerBase
    {
        private readonly ISubmittedTeamService _submittedTeam;

        public SubmittedTeamController(ISubmittedTeamService submittedTeam)
        {
            _submittedTeam = submittedTeam;
        }

        [Authorize]
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitProject(SubmitProjectAPIViewModel request)
        {
            try
            {
                // Lấy AccountId từ Token JWT
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _submittedTeam.SubmitTopicAsync(accountId, request);
                if (isSuccess)
                {
                    return Ok(new { message = "Track submited successfully" });
                }
                return BadRequest("cannot submit track");
            }
            catch (Exception ex)
            {
                // Bắt chính xác lỗi (chưa đủ 3 người, không phải leader...) trả về Frontend
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}