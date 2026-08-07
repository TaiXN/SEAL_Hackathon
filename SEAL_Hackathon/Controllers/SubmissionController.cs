using APIViewModels.Submission;
using APIViewModels.TeamProject;
using Microsoft.AspNetCore.Authorization;
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

        // Thay đổi Route để Frontend phải truyền đúng Event nào
        [HttpPost("{teamId}/event/{eventId}/submit-urls")]
        public async Task<IActionResult> SubmitProjectUrls(string teamId, string eventId, [FromBody] SubmitGithubAPIViewModel request)
        {
            try
            {
                string accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(accountId)) return Unauthorized();

                bool isSuccess = await _submission.SubmitUrlAsync(accountId, teamId, eventId, request);
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

        [HttpGet]
        [Authorize(Roles = "Admin, Judge, Teacher")] 
        public async Task<IActionResult> GetAll()
        {
            List<SubmissionAPIViewModel> result = await _submission.GetAllSubmissionsAsync();

            return Ok(result);
        }

        [HttpGet("audit-logs/{teamId}")]
        [Authorize] 
        public async Task<IActionResult> GetAuditLogsByTeam(string teamId)
        {
            if (string.IsNullOrEmpty(teamId))
            {
                return BadRequest(new { message = "Team ID is required." });
            }

            List<SubmissionAuditLogAPIViewModel> result = await _submission.GetAuditLogsByTeamAsync(teamId);

            if (result == null || !result.Any())
            {
                return NotFound(new { message = "No audit logs found for this team." });
            }

            return Ok(result);
        }
    }
}
