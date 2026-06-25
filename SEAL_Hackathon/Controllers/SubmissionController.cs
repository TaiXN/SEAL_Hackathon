using APIViewModels.TeamProject;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.SubmissionService;
using Services.UniversityService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubmissionController : ControllerBase
    {
        private readonly ISubmissionService _submission;

        public SubmissionController(ISubmissionService submission)
        {
            _submission = submission;
        }

        [HttpPost("{teamId}/submit-urls")]
        public async Task<IActionResult> SubmitProjectUrls(string teamId, [FromBody] SubmitGithubAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _submission.SubmitUrlAsync(accountId, teamId, request);
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
