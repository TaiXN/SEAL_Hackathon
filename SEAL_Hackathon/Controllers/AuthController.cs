using APIViewModels.Auth;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Identity.Client;
using Services.AccessTokenService;
using Services.AccountService;
using Services.RefreshTokenService;
using Services.Utils;
using System.Security.Claims;

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

        [AllowAnonymous]
        [HttpPost("refreshtoken")]
        public async Task<IActionResult> RefreshToken()
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
            {
                return BadRequest("Refresh token is required");
            }
            Account accountInfo = await _refreshToken.CheckRefreshToken(refreshToken);
            if (accountInfo != null)
            {
                string accessToken = _accessToken.GenerateJwtToken(accountInfo.AccountId, accountInfo.Email, accountInfo.Role.RoleName);
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

        [Authorize]
        [HttpPost("checktoken")]
        public async Task<IActionResult> CheckToken()
        {
            string header = Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(header))
            {
                string tokenValue = header.Split(" ")[1];// "BEARER asdosamdxosandiasn"
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
                // Không tìm thấy dữ liệu (Cache bị trống hoặc đã hết hạn)
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
                string tokenValue = header.Split(" ")[1];// "BEARER asdosamdxosandiasn"
                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                //add access token to blacklist
                bool isRevoked = await _refreshToken.RevokeTokenAsync(accId);
                if (isRevoked)
                {
                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        // Tự động xóa khỏi Cache khi Token tự hết hạn để giải phóng RAM
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
                    //check login
                    Account accountDb = await _account.CheckLoginAsync(info.Email, info.Password);
                    if (accountDb != null)
                    {
                        if (accountDb.Role.RoleName.Equals("Teacher"))
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
                            return Unauthorized();
                        }
                    }
                    else return BadRequest("Email or password is incorrect");

                }
                catch (Exception ex)
                {
                    return StatusCode(500, "Error occurred");
                }

                //check role
                //generate access token
                //generate refresh token
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
                    //check login
                    Account accountDb = await _account.CheckLoginAsync(info.Email, info.Password);
                    if (accountDb != null)
                    {
                        if (accountDb.Role.RoleName.Equals("Admin"))
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
                            return Unauthorized();
                        }
                    }
                    else return BadRequest("Email or password is incorrect");

                }
                catch (Exception ex)
                {
                    return StatusCode(500, "Error occurred");
                }

                //check role
                //generate access token
                //generate refresh token
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
