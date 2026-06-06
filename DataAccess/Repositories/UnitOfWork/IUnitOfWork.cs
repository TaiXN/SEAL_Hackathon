using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.PlayerRepository;
using DataAccess.Repositories.PrizeRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.SubmittedTeamRepository;
using DataAccess.Repositories.TeacherRepository;
using DataAccess.Repositories.TeamRepository;
using DataAccess.Repositories.TopicRepository;
using DataAccess.Repositories.TrackRepository;
using DataAccess.Repositories.UserTeamRepository;
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


        IEventRepository Event { get; }
        IPrizeRepository Prize { get; }
        IRoundRepository Round { get; }

        IUserTeamRepository UserTeam { get; }
        ISubmittedTeamRepository SubmittedTeam { get; }
        ITrackRepository Track { get; }
        ITopicRepository Topic { get; }

        Task SaveAsync();
    }
}
