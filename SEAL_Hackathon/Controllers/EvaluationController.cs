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
                    return BadRequest("Evaluate failed. Track does not exist, or you are not assigned as a Judge for this Track.");
                }
            }
            return BadRequest(ModelState);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
         
            List<Evaluation> result = await _evaluation.GetAllEventsAsync();
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

     
        [HttpPut("{teacherId}")]
        [Authorize(Roles = "Judge, Teacher")]
        public async Task<IActionResult> Update(string teacherId, UpdateEvaluationAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _evaluation.UpdateEvaluationAsync(teacherId, info);

                if (isSuccess)
                {
                    return Ok("Update evaluation successfully");
                }
                else
                {
                    return BadRequest("Update failed. Evaluation not found or you are not the owner of this score.");
                }
            }
            return BadRequest(ModelState);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] 
        public async Task<IActionResult> Delete(string id)
        {
            bool isSuccess = await _evaluation.DeleteEvaluationAsync(id);

            if (isSuccess)
            {
                return Ok("Delete evaluation successfully");
            }
            else
            {
                return BadRequest("Delete failed. Evaluation ID not found.");
            }
        }

    }
}
