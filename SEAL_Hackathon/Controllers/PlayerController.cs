using APIViewModels.Auth;
using APIViewModels.Gmail;
using APIViewModels.Student;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.AccessTokenService;
using Services.AccountService;
using Services.PlayerService;
using Services.RefreshTokenService;
using System;
using System.Collections.Generic;
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
        public async Task<IActionResult> Register([FromForm] RegisterAPIViewModel info)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                bool isSuccess = await _player.RegisterPlayerAsync(info);
                if (isSuccess)
                {
                    return Ok(new { message = "Sign up successfully." });
                }

                return BadRequest(new { message = "This email has already been used." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"SERVER ERROR: {ex.InnerException?.Message ?? ex.Message}" });
            }
        }

        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp(VerifyOtpAPIViewModel request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                bool isSuccess = await _player.VerifyEmailOtpAsync(request);
                if (isSuccess)
                {
                    return Ok(new { message = "Verify Gmail successfully! You can now login." });
                }

                return BadRequest(new { message = "Verification failed." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("all-players")]
        public async Task<IActionResult> GetAllPlayers()
        {
            List<StudentAPIViewModel> result = await _player.GetAllPlayersAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPlayers()
        {
            List<StudentAPIViewModel> result = await _player.GetPendingPlayersAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{studentId}/approve")]
        public async Task<IActionResult> ApprovePlayer(string studentId)
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return BadRequest(new { message = "Student ID is required." });
            }

            bool isApproved = await _player.ApprovePlayerAsync(studentId);
            if (isApproved)
            {
                return Ok(new { message = "Student has been approved successfully!" });
            }

            return BadRequest(new { message = "Student not found or an error occurred." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{studentId}/reject")]
        public async Task<IActionResult> RejectPlayer(string studentId)
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return BadRequest(new { message = "Student ID is required." });
            }

            bool isRejected = await _player.RejectPlayerAsync(studentId);
            if (isRejected)
            {
                return Ok(new { message = "Student has been rejected and deleted successfully!" });
            }

            return BadRequest(new { message = "Student not found or an error occurred." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("ban")]
        public async Task<IActionResult> BanPlayer([FromBody] BanPlayerAPIViewModel request)
        {
            if (request == null || string.IsNullOrEmpty(request.StudentId))
            {
                return BadRequest(new { message = "Student ID is required." });
            }

            (bool IsSuccess, string Message) result = await _player.BanPlayerAsync(request);
            if (result.IsSuccess)
            {
                return Ok(new { message = result.Message });
            }

            return BadRequest(new { message = result.Message });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{studentId}/unban")]
        public async Task<IActionResult> UnbanPlayer(string studentId)
        {
            if (string.IsNullOrEmpty(studentId))
            {
                return BadRequest(new { message = "Student ID is required." });
            }

            (bool IsSuccess, string Message) result = await _player.UnbanPlayerAsync(studentId);
            if (result.IsSuccess)
            {
                return Ok(new { message = result.Message });
            }

            return BadRequest(new { message = result.Message });
        }
    }
}