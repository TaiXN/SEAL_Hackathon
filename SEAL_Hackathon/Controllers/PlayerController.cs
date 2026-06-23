using APIViewModels.Auth;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.AccessTokenService;
using Services.AccountService;
using Services.PlayerService;
using Services.RefreshTokenService;
using System;
using System.Threading.Tasks;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlayerController : ControllerBase
    {
        private readonly IPlayerService _player;
        private readonly IAccountService _account; // Kept to use CheckLoginAsync
        private readonly IAccessTokenService _accessToken;
        private readonly IRefreshTokenService _refreshToken;

        public PlayerController(IPlayerService player, IAccountService account, IAccessTokenService accessToken, IRefreshTokenService refreshToken)
        {
            _player = player;
            _account = account;
            _accessToken = accessToken;
            _refreshToken = refreshToken;
        }

        

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    bool isSuccess = await _player.RegisterPlayerAsync(info);
                    if (isSuccess)
                    {
                        return Ok(new { message = "sign up successfully" });
                    }
                    else
                    {
                        return BadRequest(new { message = "this email has already been used" });
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = $"SERVER ERROR: {ex.InnerException?.Message ?? ex.Message}" });
                }
            }
            return BadRequest(ModelState);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{studentId}/approve")]
        public async Task<IActionResult> ApprovePlayer(string studentId)
        {
            if (string.IsNullOrEmpty(studentId))
                return BadRequest(new { message = "Student ID is required." });

            bool isApproved = await _player.ApprovePlayerAsync(studentId);
            if (isApproved)
            {
                return Ok(new { message = "Student has been approved successfully!" });
            }
            return BadRequest(new { message = "Student not found or an error occurred." });
        }
    }
}