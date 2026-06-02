using APIViewModels.Auth;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Services.AccessTokenService;
using Services.AccountService;
using Services.RefreshTokenService;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAccountService _account;
        private readonly IAccessTokenService _accessToken;
        private readonly IRefreshTokenService _refreshToken;
        private readonly IMemoryCache _cache;

        public AuthController(IAccountService account, IAccessTokenService accessToken, IRefreshTokenService refreshToken, IMemoryCache cache)
        {
            _accessToken = accessToken;
            _account = account;
            _refreshToken = refreshToken;
            _cache = cache;
        }

        [Authorize]
        [HttpPost("checktoken")]
        public async Task<IActionResult> CheckToken()
        {
            string header = Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(header))
            {
                string tokenValue = header.Split(" ")[1];
                if (!CheckBlackList(tokenValue))
                {
                    string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    string email = User.FindFirst(ClaimTypes.Email)?.Value;
                    string role = User.FindFirst(ClaimTypes.Role)?.Value;
                    return Ok(new CheckTokenResultAPIViewModel()
                    {
                        Role = role,
                        AccId = accId,
                        Email = email
                    });
                }
                else
                {
                    return Unauthorized();
                }
            }
            else
            {
                return Unauthorized();
            }
        }

        private bool CheckBlackList(string tokenValue)
        {
            if (_cache.TryGetValue($"blacklist:{tokenValue}", out bool? cachedData))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            string header = Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(header))
            {
                string tokenValue = header.Split(" ")[1];
                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                bool isRevoked = await _refreshToken.RevokeTokenAsync(accId);
                if (isRevoked)
                {
                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
                    };
                    _cache.Set($"blacklist:{tokenValue}", true, cacheOptions);
                    return Ok(_cache.Get($"blacklist:{tokenValue}"));
                }
                else
                {
                    return BadRequest();
                }
            }
            else return Unauthorized();
        }

        [AllowAnonymous]
        [HttpPost("teacher/login")]
        public async Task<IActionResult> TeacherLogin(LoginAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    Account accountDb = await _account.CheckLoginAsync(info.Email, info.Password);
                    if (accountDb != null)
                    {
                        if (accountDb.Role.RoleName.Equals("Teacher"))
                        {
                            string accessToken = _accessToken.GenerateJwtToken(accountDb.AccountId, accountDb.Email, accountDb.Role.RoleName);
                            string refreshToken = await _refreshToken.GenerateRefreshTokenAsync(accountDb.AccountId);
                            return Ok(new LoginResultAPIViewModel()
                            {
                                AccessToken = accessToken,
                                RefreshToken = refreshToken
                            });
                        }
                        else
                        {
                            return Unauthorized();
                        }
                    }
                    else return BadRequest("Email or password is incorrect");
                }
                catch (Exception)
                {
                    return StatusCode(500, "Error occurred");
                }
            }
            else return BadRequest();
        }

        [AllowAnonymous]
        [HttpPost("admin/login")]
        public async Task<IActionResult> AdminLogin(LoginAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    Account accountDb = await _account.CheckLoginAsync(info.Email, info.Password);
                    if (accountDb != null)
                    {
                        if (accountDb.Role.RoleName.Equals("Admin"))
                        {
                            string accessToken = _accessToken.GenerateJwtToken(accountDb.AccountId, accountDb.Email, accountDb.Role.RoleName);
                            string refreshToken = await _refreshToken.GenerateRefreshTokenAsync(accountDb.AccountId);
                            return Ok(new LoginResultAPIViewModel()
                            {
                                AccessToken = accessToken,
                                RefreshToken = refreshToken
                            });
                        }
                        else
                        {
                            return Unauthorized();
                        }
                    }
                    else return BadRequest("Email or password is incorrect");
                }
                catch (Exception)
                {
                    return StatusCode(500, "Error occurred");
                }
            }
            else return BadRequest();
        }

        [Authorize]
        [HttpPut("changepassword")]
        public async Task<IActionResult> UpdatePassword(UpdateNewPasswordAPIViewModel accountInfo)
        {
            if (ModelState.IsValid)
            {
                if (accountInfo.NewPassword != accountInfo.RePassword)
                {
                    return BadRequest("Please enter the same password.");
                }

                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                bool isUpdated = await _account.UpdatePassword(accId, accountInfo.OldPassword, accountInfo.NewPassword);
                if (isUpdated)
                {
                    return Ok("Change password successfully !!!");
                }
                else
                {
                    return BadRequest("Password is incorrect");
                }
            }
            else
            {
                return BadRequest("Password is incorrect");
            }
        }
    }
}