using APIViewModels.Prize;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.EventService;
using Services.PrizeService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrizeController : ControllerBase
    {
        private readonly IPrizeService _prize;

        public PrizeController(IPrizeService prize)
        {
            _prize = prize;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePrize(CreatePrizeAPIViewModel request)
        {
            (bool IsSuccess, string Message) result = await _prize.CreatePrizeAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }


        [HttpGet]
        public async Task<IActionResult> GetAllPrizes()
        {
            List<Prize> result = await _prize.GetAllPrizesAsync();
            return Ok(result);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetPrizeById(string id)
        {
            Prize result = await _prize.GetPrizeByIdAsync(id);

            if (result == null)
            {
                return NotFound(new { message = "Prize not found." });
            }

            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePrize(string id, UpdatePrizeAPIViewModel request)
        {
            (bool IsSuccess, string Message) result = await _prize.UpdatePrizeAsync(id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePrize(string id)
        {
            (bool IsSuccess, string Message) result = await _prize.DeletePrizeAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        [HttpPut("manual-assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ManualAssignPrize( PrizeAPIViewModel request)
        {
            
            (bool IsSuccess, string Message) result = await _prize.ManualAssignPrizeAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }
    }
}
