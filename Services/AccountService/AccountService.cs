using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Threading.Tasks;

namespace Services.AccountService
{
    public class AccountService : IAccountService
    {
        private readonly IUnitOfWork _uow;
        private readonly string PRIVATEKEY = "dasox!@#!mxosnadoxnWCASDASCDASXD12312-123!@#!@#!@";

        public AccountService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Account> CheckLoginAsync(string email, string password)
        {
            return await _uow.Account.GetFirstOrDefaultAsync(q => q.Email.Equals(email) && q.Password.Equals(HashBuilder.ComputeSha256Hash(password + PRIVATEKEY)), "Role");
        }

        public async Task<Account> GetAccountByIdAsync(string accountId)
        {
            return await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId.Equals(accountId));
        }

        public async Task<bool> UpdatePassword(string accId, string oldpassword, string newPassword)
        {
            try
            {
                Account account = await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId == accId);
                if (account != null)
                {
                    string hashedPass = HashBuilder.ComputeSha256Hash(oldpassword + PRIVATEKEY);
                    if (hashedPass == account.Password)
                    {
                        account.Password = HashBuilder.ComputeSha256Hash(newPassword + PRIVATEKEY);
                        _uow.Account.Update(account);
                        await _uow.SaveAsync();
                        return true;
                    }
                    else return false;
                }
                else
                {
                    return false;
                }
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}