using DataAccess.Entities;
using System.Threading.Tasks;

namespace Services.AccountService
{
    public interface IAccountService
    {
        Task<Account> CheckLoginAsync(string email, string password);
        Task<Account> GetAccountByIdAsync(string accountId);
        Task<bool> UpdatePassword(string accId, string oldpassword, string newPassword);

    }
}