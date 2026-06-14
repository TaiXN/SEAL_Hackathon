using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.PrizeRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.StudentRepository;
using DataAccess.Repositories.SubmissionRepository;
using DataAccess.Repositories.TeacherRepository;
using DataAccess.Repositories.TeamInRoundRepository;
using DataAccess.Repositories.TeamMemberRepository;
using DataAccess.Repositories.TeamRepository;
using DataAccess.Repositories.TopicRepository;
using DataAccess.Repositories.TrackRepository;

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

        IStudentRepository Student { get; }
        ITeamMemberRepository TeamMember { get; }
        ITeamInRoundRepository TeamInRound { get; }

        IEventRepository Event { get; }
        IPrizeRepository Prize { get; }
        IRoundRepository Round { get; }

        ITrackRepository Track { get; }
        ITopicRepository Topic { get; }
        ISubmissionRepository Submission { get; }

        Task SaveAsync();
    }
}
