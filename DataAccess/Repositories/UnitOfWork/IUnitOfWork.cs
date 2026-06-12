using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.CriteriaRepository;
using DataAccess.Repositories.CriteriaSetRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.MappingRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.TeacherListRepository;
using DataAccess.Repositories.TeacherRepository;
using DataAccess.Repositories.TopicRepository;
using DataAccess.Repositories.TrackRepository;

namespace DataAccess.Repositories.UnitOfWork
{
    public interface IUnitOfWork
    {
        IAccountRepository Account { get; }
        IRoleRepository Role { get; }
        IRefreshTokenRepository RefreshToken { get; }
        IAdminRepository Admin { get; }
        ITeacherRepository Teacher { get; }
        IRoundRepository Round { get; }
        IEventRepository Event { get; }

        ICriteriaRepository Criteria { get; }
        IMappingRepository Mapping { get; }
        ICriteriaSetRepository CriteriaSet { get; }
        ITrackRepository Track { get; }
        ITopicRepository Topic { get; }
        ITeacherListRepository TeacherList { get; }
       
        Task SaveAsync();
    }
}
