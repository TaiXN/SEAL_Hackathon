using APIViewModels.LeaderBoard;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.LeaderBoardService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeaderBoardController : ControllerBase
    {
        private readonly ILeaderBoardService _leaderBoardService;

       
        public LeaderBoardController(ILeaderBoardService leaderBoardService)
        {
            _leaderBoardService = leaderBoardService;
        }

        
        [HttpGet("{roundId}/{trackId}")]
        public async Task<IActionResult> GetLeaderBoardDetail(string roundId, string trackId)
        {
          
            List<LeaderBoardDisplayAPIViewModel> result = await _leaderBoardService.GetLeaderBoardAsync(roundId, trackId);

            return Ok(result);

        }

        
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            List<LeaderBoard> result = await _leaderBoardService.GetAllLeaderBoardAsync();
            return Ok(result);
        }
    }
}
