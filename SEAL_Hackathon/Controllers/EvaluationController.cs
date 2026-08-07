using APIViewModels.Evaluation;
using APIViewModels.LeaderBoard;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.EvaluationService;
using Services.LeaderBoardService;
using System.Security.Claims;


namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluationController : ControllerBase
    {
        private readonly IEvaluationService _evaluation;
        private readonly ILeaderBoardService _leaderboard;

        public EvaluationController(IEvaluationService evaluations, ILeaderBoardService leaderboards)
        {
            _evaluation = evaluations;
            _leaderboard = leaderboards;
        }

        [HttpPost("{teacherId}")]
        [Authorize(Roles = "Judge, Teacher, Admin")]
        public async Task<IActionResult> CreateEvaluation(string teacherId, EvaluationAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _evaluation.CreateEvaluateAsync(teacherId, info);

                if (isSuccess)
                {
                    return Ok("Evaluate submission successfully");
                }
                else
                {
                    return BadRequest("Evaluate failed. Track does not exist, or you are not assigned as a Judge for this Track.");
                }
            }
            return BadRequest(ModelState);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            List<EvaluationDetailAPIViewModel> result = await _evaluation.GetAllEvaluationsDetailedAsync();

            return Ok(result);
        }


        [HttpGet("{id}")]

        public async Task<IActionResult> GetById(string id)
        {
            Evaluation result = await _evaluation.GetEvaluationByIdAsync(id);

            if (result == null)
            {
                return NotFound("Evaluation not found");
            }

            return Ok(result);
        }

        [HttpGet("submission/{submissionId}")]
        public async Task<IActionResult> GetBySubmissionId(string submissionId)
        {
            
            List<EvaluationDetailAPIViewModel> result = await _evaluation.GetEvaluationsBySubmissionIdAsync(submissionId);

          
            return Ok(result);
        }


        [HttpPut("update-score/{teacherId}")]
        [Authorize(Roles = "Judge, Teacher")]
        public async Task<IActionResult> UpdateScore(string teacherId, UpdateEvaluationAPIViewModel request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                bool isSuccess = await _evaluation.UpdateEvaluationAsync(teacherId, request);

                if (isSuccess)
                {
                    return Ok("Successfully updated the score and recorded the system history!");
                }
                else
                {
                    return BadRequest("Update failed. You do not have permission to edit this score or the data is invalid.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Judge, Teacher")]
        public async Task<IActionResult> Delete(string id)
        {
            string? teacherId =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(teacherId))
            {
                return Unauthorized("Cannot identify the current account.");
            }

            bool isSuccess =
                await _evaluation.DeleteEvaluationAsync(
                    teacherId,
                    id
                );

            if (isSuccess)
            {
                return Ok("Delete evaluation successfully");
            }

            return BadRequest(
                "Delete failed. The evaluation may not belong to you, " +
                "the scoring period may be closed, or it may already have audit logs."
            );
        }

        [HttpGet("{evaluationId}/audit-logs")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> GetAuditLogs(string evaluationId)
        {
            try
            {
                if (string.IsNullOrEmpty(evaluationId))
                {
                    return BadRequest("Evaluation ID cannot be empty.");
                }

                List<EvaluationAuditLogAPIViewModel> result = await _evaluation.GetAuditLogsByEvaluationIdAsync(evaluationId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }

        [HttpGet("judge/audit-logs/{evaluationId}")]
        [Authorize(Roles = "Judge, Teacher")]
        public async Task<IActionResult> GetJudgeAuditLogs(string evaluationId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(evaluationId))
                {
                    return BadRequest(
                        "Evaluation ID cannot be empty."
                    );
                }

                string? teacherId =
                    User.FindFirst(
                        ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrWhiteSpace(teacherId))
                {
                    return Unauthorized(
                        "Cannot identify the current Judge."
                    );
                }

                List<EvaluationAuditLogAPIViewModel> result =
                    await _evaluation
                        .GetJudgeAuditLogsAsync(
                            teacherId,
                            evaluationId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    $"Server error: {ex.Message}"
                );
            }
        }

    }
}
