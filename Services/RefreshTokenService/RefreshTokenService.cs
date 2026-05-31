using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.RefreshTokenService
{
    public class RefreshTokenService:IRefreshTokenService
    {
        private readonly IUnitOfWork _uow;
        public RefreshTokenService(IUnitOfWork uow)
        {
            _uow = uow;
        }
        public async Task<Account> CheckRefreshToken(string refreshToken)
        {
            RefreshToken rToken = await _uow.RefreshToken.GetFirstOrDefaultAsync(q=> q.TokenValue == refreshToken && q.IsRevoked ==false && q.ExpiredDate > DateTime.Now, "Account");
            if (rToken == null) return null;
            else
            {
                Role role = await _uow.Role.GetFirstOrDefaultAsync(q => q.RoleId == rToken.Account.RoleId);
                rToken.Account.Role = role;
                return rToken.Account;
            }
        }
        public async Task<bool> RevokeTokenAsync(string accId)
        {
            RefreshToken rTokenDb = await _uow.RefreshToken.GetFirstOrDefaultAsync(q => q.AccountId == accId);
            if (rTokenDb != null)
            {
                rTokenDb.IsRevoked = true;
                _uow.RefreshToken.Update(rTokenDb);
                await _uow.SaveAsync();
                return true;
            }
            else
            {
                return false;
            }
        }
        public async Task<string> GenerateRefreshTokenAsync(string accId)
        {
            //check refresh token exist 
            RefreshToken rtokenDb = await _uow.RefreshToken.GetFirstOrDefaultAsync(q=> q.AccountId == accId);
            if(rtokenDb == null)
            {
                RefreshToken newRToken = new RefreshToken()
                {
                    AccountId = accId,
                    ExpiredDate = DateTime.Now.AddDays(14),
                    IsRevoked = false,
                    TokenId = Guid.NewGuid().ToString(),
                    TokenValue = Guid.NewGuid().ToString()

                };
                await _uow.RefreshToken.AddAsync(newRToken);
                await _uow.SaveAsync();
                return newRToken.TokenValue;
            }
            else
            {
                rtokenDb.TokenValue = Guid.NewGuid().ToString();
                rtokenDb.ExpiredDate = DateTime.Now.AddDays(14);
                rtokenDb.IsRevoked = false;
                _uow.RefreshToken.Update(rtokenDb);
                await _uow.SaveAsync();
                return rtokenDb.TokenValue;
            }
        }
    }
}
