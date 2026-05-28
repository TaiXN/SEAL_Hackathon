using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.CategoryRepository;
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
    public interface IUnitOfWork
    {
        IAccountRepository Account { get; }
        IRoleRepository Role { get; }
        IRefreshTokenRepository RefreshToken { get; }
        IAdminRepository Admin { get; }
        ITeacherRepository Teacher { get; }
        IPrizeRepository Prize { get; }
        IRoundRepository Round { get; }
        ICategoryRepository Category { get; }
        IEventRepository Event { get; }
        Task SaveAsync();
    }
}
