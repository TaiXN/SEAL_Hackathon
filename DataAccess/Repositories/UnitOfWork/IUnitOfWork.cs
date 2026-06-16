using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.CriteriaRepository;
using DataAccess.Repositories.CriteriaSetRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.MappingRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.StudentRepository;
using DataAccess.Repositories.SubmissionRepository;
using DataAccess.Repositories.TeamInRoundRepository;
using DataAccess.Repositories.TeamMemberRepository;
using DataAccess.Repositories.TeamRepository;
using DataAccess.Repositories.TopicRepository;
using DataAccess.Repositories.TrackRepository;
using DataAccess.Repositories.TeacherListRepository;
using DataAccess.Repositories.TeacherRepository;
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

        ITeamRepository Team { get; }

        IStudentRepository Student { get; }
        ITeamMemberRepository TeamMember { get; }
        ITeamInRoundRepository TeamInRound { get; }

        IEventRepository Event { get; }
      
        ITeacherRepository Teacher { get; }
        IRoundRepository Round { get; }
        IEventRepository Event { get; }

        ICriteriaRepository Criteria { get; }
        IMappingRepository Mapping { get; }
        ICriteriaSetRepository CriteriaSet { get; }
        ITrackRepository Track { get; }
        ITopicRepository Topic { get; }
        ITeacherListRepository TeacherList { get; }
       

        ITrackRepository Track { get; }
        ITopicRepository Topic { get; }
        ISubmissionRepository Submission { get; }

        Task SaveAsync();
    }
}
