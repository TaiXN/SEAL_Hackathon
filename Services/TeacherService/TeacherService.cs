using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace Services.TeacherService
{
    public class TeacherService : ITeacherService
    {
        private readonly IUnitOfWork _uow;
        private readonly string PRIVATEKEY = "dasox!@#!mxosnadoxnWCASDASCDASXD12312-123!@#!@#!@";
        public TeacherService(IUnitOfWork uow)
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

        public async Task<bool> CreateAsync(Account account, bool isGuest)
        {
            try
            {
                if (!(await IsDuplicateEmail(account.Email)))
                {
                    string hashedPassword = HashBuilder.ComputeSha256Hash(account.Password + PRIVATEKEY);
                    string roleId = (await _uow.Role.GetFirstOrDefaultAsync(q => q.RoleName.Equals("Teacher"))).RoleId;
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
                    Teacher newTeacher = new Teacher()
                    {
                        Id = newAccount.AccountId,
                        IsGuest = isGuest
                    };
                    await _uow.Teacher.AddAsync(newTeacher);
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

        public async Task<List<Teacher>> GetAllAsync()
        {
            try
            {
                List<Teacher> result = await _uow.Teacher.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Teacher>();
            }
        }

        public async Task<Teacher> GetByIdAsync(string id)
        {
            try
            {
                return await _uow.Teacher.GetFirstOrDefaultAsync(e => e.Id == id);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateAsync(string id, Account updatedAccount, bool isGuest)
        {
            try
            {
                Account accountDb = await _uow.Account.GetFirstOrDefaultAsync(q => q.AccountId.Equals(id));
                if (accountDb == null)
                {
                    return false;
                }

                if (accountDb.Email.ToLower() != updatedAccount.Email.ToLower())
                {
                    Account checkEmail = await _uow.Account.GetFirstOrDefaultAsync(e => e.Email.ToLower() == updatedAccount.Email.ToLower() && e.AccountId != id);
                    if (checkEmail != null) return false;
                    accountDb.Email = updatedAccount.Email;
                }

                accountDb.FullName = updatedAccount.FullName;
                accountDb.Address = updatedAccount.Address;
                accountDb.Phone = updatedAccount.Phone;
                _uow.Account.Update(accountDb);

                Teacher teacherDb = await _uow.Teacher.GetFirstOrDefaultAsync(q => q.Id.Equals(id));
                if (teacherDb != null)
                {
                    teacherDb.IsGuest = isGuest;
                    _uow.Teacher.Update(teacherDb);
                }

                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteAsync(string id)
        {
            try
            {
                Account result = await _uow.Account.GetFirstOrDefaultAsync(e => e.AccountId.Equals(id));
                if (result == null) return false;

                result.IsActive = false;
                _uow.Account.Update(result);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}
