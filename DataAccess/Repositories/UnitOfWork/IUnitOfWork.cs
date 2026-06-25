using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.CriteriaRepository;
using DataAccess.Repositories.CriteriaSetRepository;
using DataAccess.Repositories.EvaluationRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.MappingRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.StudentRepository;
using DataAccess.Repositories.SubmissionRepository;
using DataAccess.Repositories.TeacherListRepository;
using DataAccess.Repositories.TeacherRepository;
using DataAccess.Repositories.TeamInRoundRepository;
using DataAccess.Repositories.TeamMemberRepository;
using DataAccess.Repositories.TeamRepository;
using DataAccess.Repositories.TopicRepository;
using DataAccess.Repositories.TrackRepository;
using DataAccess.Repositories.UniversityRepository;

namespace DataAccess.Repositories.UnitOfWork
{
    public interface IUnitOfWork
    {
        IAccountRepository Account { get; }
        IRoleRepository Role { get; }
        IRefreshTokenRepository RefreshToken { get; }

        
=========

        ITeamRepository Team { get; }
      
        ITeamMemberRepository TeamMember { get; }
        IEventRepository Event { get; }
      
>>>>>>>>> Temporary merge branch 2
        ITeacherRepository Teacher { get; }
        IRoundRepository Round { get; }
        ICriteriaRepository Criteria { get; }
        IMappingRepository Mapping { get; }
        ICriteriaSetRepository CriteriaSet { get; }
        ITrackRepository Track { get; }
        ITopicRepository Topic { get; }
        ITeacherListRepository TeacherList { get; }
        IEvaluationRepository Evaluation { get; }

     

        IUniversityRepository University { get; }
        ISubmissionRepository Submission { get; }

        ITeamInRoundRepository TeamInRound { get; }

        Task SaveAsync();
    }
}
