using APIViewModels.Judge;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.EvaluationService;
using Services.JudgeService;
using Services.MentorService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JudgeController : ControllerBase
    {
        private readonly IJudgeService _judge;
        private readonly IEvaluationService _evaluate;

        public JudgeController(IJudgeService judges, IEvaluationService evaluate)
        {
            _judge = judges;
            _evaluate = evaluate;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("track/{trackId}/teacher/{judgeId}")] 
        public async Task<IActionResult> AddJudge(string judgeId, string trackId)
        {
            if (string.IsNullOrEmpty(judgeId) || string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Missing Judge ID or Track ID.");
            }

            bool isAdded = await _judge.AddJudge(judgeId, trackId);

            if (isAdded)
            {
                return Ok("Add judge successfully!");
            }

            return BadRequest("Added fail.");
        }

       
        [Authorize(Roles = "Admin")]
        [HttpGet("track/{trackId}")]
        public async Task<IActionResult> GetJudgesByTrack(string trackId)
        {
            if (string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Invalid track ID.");
            }

            List<TeacherList> judges = await _judge.GetJudgesByTrackAsync(trackId);

            if (judges == null || judges.Count == 0)
            {
                return NotFound("Empty judge");
            }

            return Ok(judges);
        }

       
        [Authorize(Roles = "Admin")]
        [HttpDelete("track/{trackId}/teacher/{judgeId}")]
        public async Task<IActionResult> RemoveJudge(string judgeId, string trackId)
        {
            if (string.IsNullOrEmpty(judgeId) || string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Please enter Judge ID or Track ID.");
            }

            bool isRemoved = await _judge.RemoveJudge(judgeId, trackId);

            if (isRemoved)
            {
                return Ok("Delete Judge successfully!");
            }

            return BadRequest("Error while deleting judge.");
        }

        [HttpGet("dashboard-assignments/{teacherId}")]
        [Authorize(Roles = "Judge, Teacher, Admin")] 
        public async Task<IActionResult> GetDashboardAssignments(string teacherId)
        {
            List<JudgeDashboardAssignmentAPIViewModel> result = await _evaluate.GetDashboardAssignmentsAsync(teacherId);

            return Ok(result);
        }
    }
}
