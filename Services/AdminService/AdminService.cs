using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace Services.AdminService
{
    public class AdminService:IAdminService
    {
        private readonly IUnitOfWork _uow;
        private readonly string PRIVATEKEY = "dasox!@#!mxosnadoxnWCASDASCDASXD12312-123!@#!@#!@";

        public AdminService(IUnitOfWork uow)
        {
            _uow = uow;
        }

   
        private async Task<bool> IsDuplicateEmail(string email)
        {
            Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(q => q.Email.ToLower().Equals(email.ToLower()));
            if (accountDb == null)
            {
                return false;
            }
            else
            {
                return true;
            }
        }

        public async Task<bool> CreateAsync(Account account, bool IsSuperAdmin)
        {
            try
            {
                if (!(await IsDuplicateEmail(account.Email)))
                {
                    string hashedPassword = HashBuilder.ComputeSha256Hash(account.Password + PRIVATEKEY);
                    string roleId = (await _uow.Role.GetFirstOrDefaultAsync(q => q.RoleName.Equals("Admin"))).RoleId;
                    Account newAccount = new Account()
                    {
                        AccountId = account.AccountId,
                        Address = account.Address,
                        Email = account.Email,
                        IsActive = true,
                        FullName = account.FullName,
                        Password = hashedPassword,
                        Phone = account.Phone,
                        RoleId = roleId
                    };
                    await _uow.Account.AddAsync(newAccount);
                    Admin newAdmin = new Admin()
                    {
                        AdminId = newAccount.AccountId,
                        IsSuperAdmin = IsSuperAdmin,
                    };
                    await _uow.Admin.AddAsync(newAdmin);
                    await _uow.SaveAsync();
                    return true;
                 
                }
                else return false;
            }
            catch (Exception ex)
            {
                return false;
            }
           
        }
    }
}
