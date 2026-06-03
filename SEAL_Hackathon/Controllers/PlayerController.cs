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
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    Account accountDb = await _account.CheckLoginAsync(info.Email, info.Password);
                    if (accountDb != null)
                    {
                        if (accountDb.Role.RoleName.Equals("Player"))
                        {
                            string accessToken = _accessToken.GenerateJwtToken(accountDb.AccountId, accountDb.Email, accountDb.Role.RoleName);
                            string refreshToken = await _refreshToken.GenerateRefreshTokenAsync(accountDb.AccountId);
                            CookieOptions cookieOptions = new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.None,
                                Expires = DateTime.UtcNow.AddDays(14)
                            };
                            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);


                            return Ok(new LoginResultAPIViewModel()
                            {
                                AccessToken = accessToken,
                                RefreshToken = refreshToken
                            });
                        }
                        else
                        {
                            return Unauthorized("This account is not a player");
                        }
                    }
                    else return BadRequest("Email or password is incorrect");
                }
                catch (Exception ex)
                {
                    return StatusCode(500, "Error occurred: " + ex.Message);
                }
            }
            return BadRequest();
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
    }
}