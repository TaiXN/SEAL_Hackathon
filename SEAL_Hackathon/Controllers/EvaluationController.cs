using APIViewModels.Evaluation;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.EvaluationService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluationController : ControllerBase
    {
        private readonly IEvaluationService _evaluation;

        public EvaluationController(IEvaluationService evaluations)
        {
            _evaluation = evaluations;
        }

        [HttpPost("{teacherId}")]
        [Authorize(Roles = "Judge, Teacher")]
        public async Task<IActionResult> Evaluate(string teacherId, EvaluationAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _evaluation.EvaluateSubmissionAsync(teacherId, info);

                if (isSuccess)
                {
                    return Ok("Evaluate submission successfully");
                }
                else
                {
                    return BadRequest("Evaluate failed. You might not be assigned to this Track, or the Submission is invalid.");
                }
            }
            return BadRequest(ModelState);
        }

        [HttpGet("submission/{submissionId}")]
        [Authorize(Roles = "Admin, Judge, Teacher")]
        public async Task<IActionResult> GetBySubmissionId(string submissionId)
        {
            List<Evaluation> result = await _evaluation.GetEvaluationsBySubmissionAsync(submissionId);

            if (result == null || result.Count == 0)
            {
                return NotFound("No evaluation found for this submission.");
            }

            return Ok(result);
        }

    }
}
