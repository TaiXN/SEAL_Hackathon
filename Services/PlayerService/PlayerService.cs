using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Threading.Tasks;
using APIViewModels.Auth;

namespace Services.PlayerService
{
    public class PlayerService : IPlayerService
    {
        private readonly IUnitOfWork _uow;
        private readonly string PRIVATEKEY = "dasox!@#!mxosnadoxnWCASDASCDASXD12312-123!@#!@#!@";

        public PlayerService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> RegisterPlayerAsync(RegisterAPIViewModel info)
        {
            var existingAcc = await _uow.Account.GetFirstOrDefaultAsync(a => a.Email == info.Email);
            if (existingAcc != null) return false;

            var playerRole = await _uow.Role.GetFirstOrDefaultAsync(r => r.RoleName == "Player" || r.RoleName == "Student");
            if (playerRole == null) throw new Exception("ERROR: cant find player role in database");

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
                IsActive = true
            };
            await _uow.Account.AddAsync(newAccount);

            var newStudent = new Student
            {
                StudentId = newAccountId,
                UniversityId = info.UniversityId,
                IsApproved = true
            };
            await _uow.Student.AddAsync(newStudent);

            await _uow.SaveAsync();
            return true;
        }
    }
}