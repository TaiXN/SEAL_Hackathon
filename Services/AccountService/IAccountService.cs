using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;


namespace Services.AccountService
{
    public interface IAccountService
    {
        Task<Account> CheckLoginAsync(string email, string password);
        Task<Account> GetAccountByIdAsync(string accountId);
        Task UpdateAccountAsync(Account account);
        Task<bool> UpdatePassword(string accId, string oldpassword, string newPassword);
        Task<bool> RegisterPlayerAsync(APIViewModels.Auth.RegisterAPIViewModel info);
    }
}
