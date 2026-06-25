using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Services.Utils;
using System;
using System.Threading.Tasks;
using APIViewModels.Auth;
using APIViewModels.Student;

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
                IsApproved = false
            };
            await _uow.Student.AddAsync(newStudent);

            await _uow.SaveAsync();
            return true;
        }

        public async Task<bool> ApprovePlayerAsync(string studentId)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == studentId);
            if (student == null) return false;

            student.IsApproved = true;
            _uow.Student.Update(student);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<List<StudentAPIViewModel>> GetPendingPlayersAsync()
        {
            var pendingList = await _uow.Student.GetAllAsync(
                s => s.IsApproved == false,
                includeProperties: "StudentNavigation,University"
            );

            return pendingList.Select(s => new StudentAPIViewModel
            {
                StudentId = s.StudentId,
                FullName = s.StudentNavigation?.FullName,
                Email = s.StudentNavigation?.Email,
                Phone = s.StudentNavigation?.Phone,
                UniversityName = s.University?.UniversityName
            }).ToList();
        }

        public async Task<bool> RejectPlayerAsync(string studentId)
        {
            var student = await _uow.Student.GetFirstOrDefaultAsync(s => s.StudentId == studentId);
            if (student == null) return false;

            var account = await _uow.Account.GetFirstOrDefaultAsync(a => a.AccountId == studentId);

            var tokens = await _uow.RefreshToken.GetAllAsync(rt => rt.AccountId == studentId); 
            if (tokens != null && tokens.Any())
            {
                _uow.RefreshToken.RemoveRange(tokens);//delete token
            }

            _uow.Student.Remove(student);

            if (account != null) _uow.Account.Remove(account);

            await _uow.SaveAsync();
            return true;
        }
    }
}