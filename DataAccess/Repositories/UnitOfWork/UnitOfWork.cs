using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.Categories;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.PrizeRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.TeacherRepository;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.UnitOfWork
{
    public class UnitOfWork:IUnitOfWork
    {
        private readonly SealHackathonContext _context;
        public IAccountRepository Account { get; private set; }
        public IRoleRepository Role { get; private set; }
        public IRefreshTokenRepository RefreshToken { get; private set; }
        public IAdminRepository Admin { get; private set; }
        public ITeacherRepository Teacher { get; private set; }
        public IEventRepository Event { get; private set; }
        public IPrizeRepository Prize { get; private set; }
        public IRoundRepository Round { get; private set; }

        public UnitOfWork(SealHackathonContext context)
        {
            _context = context;
            Account = new AccountRepository.AccountRepository(context);
            Role = new RoleRepository.RoleRepository(context);
            RefreshToken = new RefreshTokenRepository.RefreshTokenRepository(context);
            Admin = new AdminRepository.AdminRepository(context);
            Teacher = new TeacherRepository.TeacherRepository(context);
            Event = new EventRepository.EventRepository(context);
            Prize = new PrizeRepository.PrizeRepository(context);
            Round = new RoundRepository.RoundRepository(context);


        }

        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
