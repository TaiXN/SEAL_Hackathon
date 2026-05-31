using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.CategoryRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.PlayerRepository;
using DataAccess.Repositories.PrizeRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.TeacherRepository;
using DataAccess.Repositories.TeamRepository;

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

        ITeamRepository Team { get; }
        IPlayerRepository Player { get; }

        ICategoryRepository Category { get; }

        IEventRepository Event { get; }
        IPrizeRepository Prize { get; }
        IRoundRepository Round { get; }

        Task SaveAsync();
    }
}
