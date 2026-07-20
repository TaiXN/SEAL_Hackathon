using APIViewModels.Round;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.RoundService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoundController : ControllerBase
    {
        private readonly IRoundService _round;
        public RoundController(IRoundService round)
        {
            _round = round;
           
        }
       
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateRoundAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(accId)) return Unauthorized("Not found Admin.");

            bool isCreated = await _round.CreateRoundAsync(info, accId);

            if (isCreated) return Ok("Create round successfully");

            return BadRequest("Error while creating round");
        }

        [Authorize(Roles = "Admin , Judge, Teacher")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            List<RoundAPIViewModel> result = await _round.GetAllRoundsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid round ID.");

            RoundAPIViewModel currentEvent = await _round.GetRoundByIdAsync(id);
            if (currentEvent == null) return NotFound("No event found.");

            return Ok(currentEvent);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveRounds()
        {
            List<RoundAPIViewModel> result = await _round.GetActiveRoundsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<IActionResult> Update(UpdateRoundAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            bool isUpdated = await _round.UpdateRoundAsync(info);

            if (isUpdated) return Ok("Event round successful!");

            return BadRequest("Error occurred during the round update process or event not found.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid round ID.");

            bool isDeleted = await _round.DeleteRoundAsync(id);
            if (isDeleted) return Ok("Round successfully deleted.");

            return BadRequest("The round was not found, or an error occurred while deleting.");
        }

        [HttpGet("active-menus")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveMenus()
        {
            List<RoundMenuAPIViewModel> result = await _round.GetActiveMenuAsync();
            return Ok(result);
        }

        [HttpPost("auto-transition/{roundId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AutoTransitionRound(string roundId)
        {
            if (string.IsNullOrEmpty(roundId))
            {
                return BadRequest(new { message = "Missing round information!" });
            }

            (bool IsSuccess, string Message) result = await _round.AutoTransitionRoundAsync(roundId);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        
    }
}
