using APIViewModels.Event;
using APIViewModels.Round;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.AdminService;
using Services.EventService;
using Services.RoundService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoundController : ControllerBase
    {
        private readonly IRoundService _round;
        private readonly IAdminService _admin;
        public RoundController(IRoundService round, IAdminService admin)
        {
            _round = round;
            _admin = admin;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateRoundAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                if (info.StartDate >= info.EndDate)
                {
                    return BadRequest("The end date must occur after the start date.");
                }
                
                if(info.StartDate < DateTime.Now)
                {
                    return BadRequest("Please enter the restart date.");
                }
                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                DataAccess.Entities.Round newRound = new DataAccess.Entities.Round()
                {
                    RoundId = Guid.NewGuid().ToString(),
                    EventId = info.EventID,    
                    Creator = accId,
                    RoundName = info.RoundName,
                    StartDate = info.StartDate,
                    EndDate = info.EndDate,
                    TopNpromotion = info.TopNPromotion,
                    MaxTeam = info.MaxTeam,
                    IsActive = true
                };
                bool isCreated = await _round.CreateRoundAsync(newRound);
                if (isCreated)
                {
                    return Ok("Create round successfully");
                }
                else
                {
                    return BadRequest("Error while creating round");
                }

            }
            else
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var round = await _round.GetAllRoundsAsync();
            return Ok(round);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Invalid round ID.");
            }

            var currentRound = await _round.GetRoundByIdAsync(id);

            if (currentRound == null)
            {
                return NotFound("No round found.");
            }

            return Ok(currentRound);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateRoundAPIViewModel info)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingRound = await _round.GetRoundByIdAsync(id);
            if (existingRound == null)
            {
                return NotFound("No round found to update.");
            }

            if (info.StartDate >= info.EndDate)
            {
                return BadRequest("The end date must occur after the start date.");
            }

            if (info.StartDate < DateTime.Now)
            {
                return BadRequest("Please enter the restart date.");
            }

            existingRound.EventId = info.EventID;
            existingRound.RoundName = info.RoundName;
            existingRound.StartDate = info.StartDate;
            existingRound.EndDate = info.EndDate;
            existingRound.TopNpromotion = info.TopNPromotion;
            existingRound.MaxTeam = info.MaxTeam;


            bool isUpdated = await _round.UpdateRoundAsync(existingRound);

            if (isUpdated)
            {
                return Ok("Round update successful!");
            }

            return BadRequest("Error occurred during the round update process.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Invalid round ID.");
            }

            bool isDeleted = await _round.DeleteRoundAsync(id);

            if (isDeleted)
            {
                return Ok("Round successfully deleted.");
            }

            return BadRequest("The round was not found, or an error occurred while deleting.");
        }
    }
}
