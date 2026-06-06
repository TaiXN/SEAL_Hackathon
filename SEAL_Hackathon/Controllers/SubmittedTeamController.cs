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
    [Authorize(Roles = "Player")] 
    public class SubmittedTeamController : ControllerBase
    {
        private readonly ISubmittedTeamService _submittedTeam;

        public SubmittedTeamController(ISubmittedTeamService submittedTeam)
        {
            _submittedTeam = submittedTeam;
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitProject(SubmitProjectAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _submittedTeam.SubmitTopicAsync(accountId, request);
                if (isSuccess)
                {
                    return Ok(new { message = "Track submitted successfully!" });
                }
                return BadRequest(new { message = "Cannot submit track." });
            }
            catch (Exception ex)
            {
                // In thẳng lỗi do Service ném ra (VD: chưa đủ 3 người)
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}