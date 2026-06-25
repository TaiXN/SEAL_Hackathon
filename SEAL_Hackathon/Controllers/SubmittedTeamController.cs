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

        //[HttpPost("{teamId}/submit")]
        //public async Task<IActionResult> SubmitProject(string teamId, [FromBody] SubmitProjectAPIViewModel request)
        //{
        //    try
        //    {
        //        string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        //        if (string.IsNullOrEmpty(accountId)) return Unauthorized();

        //        bool isSuccess = await _submittedTeam.SubmitTopicAsync(accountId, teamId, request);
        //        if (isSuccess)
        //        {
        //            return Ok(new { message = "Track submitted successfully!" });
        //        }
        //        return BadRequest(new { message = "Cannot submit track." });
        //    }
        //    catch (Exception ex)
        //    {
        //        return BadRequest(new { message = ex.Message });
        //    }
        //}

        [HttpPost("{teamId}/submit-urls")]
        public async Task<IActionResult> SubmitProjectUrls(string teamId, [FromBody] SubmitGithubAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _submittedTeam.SubmitUrlAsync(accountId, teamId, request);
                if (isSuccess)
                {
                    return Ok(new { message = "Project URLs submitted successfully!" });
                }
                return BadRequest(new { message = "Cannot submit project URLs." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}