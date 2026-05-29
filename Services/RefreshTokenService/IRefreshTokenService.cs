using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.RefreshTokenService
{
    public interface IRefreshTokenService
    {
        Task<string> GenerateRefreshTokenAsync(string accId);
        Task<bool> RevokeTokenAsync(string accId);
        Task<Account> CheckRefreshToken(string refreshToken);
    }
}
