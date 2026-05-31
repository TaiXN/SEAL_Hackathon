using APIViewModels.Category;
using APIViewModels.Judge;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.JudgeService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JudgeController : ControllerBase
    {
        private readonly IJudgeService _judge;
        public JudgeController(IJudgeService judge)
        {
            _judge = judge;
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("judge")]
        public async Task<IActionResult> RemoveJudge(RemoveJudgeAPIViewModel judgeInfo)
        {
            if (ModelState.IsValid)
            {
                bool removed = await _judge.RemoveJudgeAsync(judgeInfo);
                if (removed)
                {
                    return Ok($"Remove Judge: {judgeInfo.TeacherId} successful");
                }
                else
                {
                    return BadRequest();
                }
            }
            else return BadRequest();
        }
        [Authorize(Roles = "Admin")]
        [HttpPost("judge")]
        public async Task<IActionResult> AddJudge(AddJudgeAPIViewModel judgeInfo)
        {
            if (ModelState.IsValid)
            {
                string result = await _judge.AddJudgeAsync(judgeInfo);
                if (result.Equals("Ok"))
                {
                    return Ok("Add judge successful");
                }
                else
                {
                    return BadRequest(result);
                }
            }
            else
            {
                return BadRequest();
            }
        }
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get(string eventId, string categoryId)
        {
            List<JudgeAPIViewModel> result = await _judge.GetByCategoryIdAsync(categoryId, eventId);
            if (result != null && result.Count >0)
            {
                return Ok(result);

            }
            else return NotFound();
        }

    }
}
