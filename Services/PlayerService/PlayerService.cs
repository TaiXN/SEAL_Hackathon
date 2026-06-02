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
            // 1. Check if Email already exists
            var existingAcc = await _uow.Account.GetFirstOrDefaultAsync(a => a.Email == info.Email);
            if (existingAcc != null)
            {
                return false;
            }

            // 2. Find "Player" RoleID
            var playerRole = await _uow.Role.GetFirstOrDefaultAsync(r => r.RoleName == "Player");
            if (playerRole == null)
            {
                throw new Exception("ERROR: cant find player in database");
            }

            // 3. Create Login Account
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

            // 4. Create Player profile
            var newPlayer = new Player
            {
                PlayerId = Guid.NewGuid().ToString(),
                AccountId = newAccountId,
                UniversityId = info.UniversityId,
                StudentId = info.StudentId,
                IsApproved = true
            };
            await _uow.Player.AddAsync(newPlayer);

            // 5. Save to SQL Server
            await _uow.SaveAsync();

            return true;
        }
    }
}