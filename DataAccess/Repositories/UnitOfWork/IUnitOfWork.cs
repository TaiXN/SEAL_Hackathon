using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.PlayerRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RoleRepository;
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
        Task SaveAsync();
    }
}
