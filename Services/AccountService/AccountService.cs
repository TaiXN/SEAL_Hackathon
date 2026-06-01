using Azure.Messaging;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using Services.Utils;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;


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

        public Task UpdateAccountAsync(Account account)
        {
            throw new NotImplementedException();
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
            catch (Exception ex)
            {
                return false;
            }

        }

        public async Task<bool> RegisterPlayerAsync(APIViewModels.Auth.RegisterAPIViewModel info)
        {
            // 1. Kiểm tra Email đã tồn tại trong hệ thống chưa
            var existingAcc = await _uow.Account.GetFirstOrDefaultAsync(a => a.Email == info.Email);
            if (existingAcc != null)
            {
                return false; // Email đã bị người khác đăng ký
            }

            // 2. Tìm RoleID của "Player" dưới Database
            var playerRole = await _uow.Role.GetFirstOrDefaultAsync(r => r.RoleName == "Player");
            if (playerRole == null)
            {
                throw new Exception("ERROR: cant find player in database");
            }

            // 3. Tạo tài khoản đăng nhập (Bảng Account)
            string newAccountId = Guid.NewGuid().ToString();
            var newAccount = new Account
            {
                AccountId = newAccountId,
                RoleId = playerRole.RoleId,
                Email = info.Email,
                Password = HashBuilder.ComputeSha256Hash(info.Password + PRIVATEKEY),
                FullName = info.FullName,
                Address = info.Address,
                Phone = info.Phone,
                IsActive = true // Vừa đăng ký xong là cho hoạt động luôn
            };
            await _uow.Account.AddAsync(newAccount);

            // 4. Tạo hồ sơ thí sinh (Bảng Player)
            var newPlayer = new Player
            {
                PlayerId = Guid.NewGuid().ToString(),
                AccountId = newAccountId,
                UniversityId = info.UniversityId,
                StudentId = info.StudentId,
                IsApproved = true // Nếu cần admin duyệt thì set thành false, ở đây cho true luôn cho tiện
            };
            await _uow.Player.AddAsync(newPlayer);

            // 5. Lưu toàn bộ xuống SQL Server
            await _uow.SaveAsync();

            return true;
        }


    }
}
