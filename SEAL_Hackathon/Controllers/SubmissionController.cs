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

        [HttpGet("audit-logs/{teamId}/event/{eventId}")]
        [Authorize(Roles = "Admin, Judge, Teacher")] 
        public async Task<IActionResult> GetAuditLogsByTeam(string teamId, string eventId)
        {
            if (string.IsNullOrEmpty(teamId) || string.IsNullOrEmpty(eventId))
            {
                return BadRequest(new { message = "Team ID and Event ID are required." });
            }

            List<SubmissionAuditLogAPIViewModel> result = await _submission.GetAuditLogsByTeamAsync(teamId, eventId);

            if (result == null || !result.Any())
            {
                return NotFound(new { message = "No audit logs found for this team in this event." });
            }

            return Ok(result);
        }

        [HttpGet("my-team/{teamId}/event/{eventId}/submission")]
        [Authorize(Roles = "Player")]
        public async Task<IActionResult> GetMySubmission(string teamId, string eventId)
        {
            try
            {
                string accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrWhiteSpace(accountId))
                {
                    return Unauthorized("Cannot identify the current account.");
                }

                SubmissionAPIViewModel result = await _submission.GetMyTeamSubmissionAsync(accountId, teamId, eventId);

                if (result == null)
                {
                    return Ok(new { message = "Your team hasn't submitted anything for this event yet." });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("my-team/{teamId}/event/{eventId}/audit-logs")]
        [Authorize(Roles = "Player")]
        public async Task<IActionResult> GetMyTeamAuditLogs(string teamId, string eventId)
        {
            try
            {
                string accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrWhiteSpace(accountId))
                {
                    return Unauthorized("Cannot identify the current account.");
                }

                List<SubmissionAuditLogAPIViewModel> result = await _submission.GetMyTeamSubmissionAuditLogsAsync(accountId, teamId, eventId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
