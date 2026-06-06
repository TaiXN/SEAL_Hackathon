using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.CategoryRepository;
using DataAccess.Repositories.CriteriaRepository;
using DataAccess.Repositories.CriteriaTemplateRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.JudgeRepository;
using DataAccess.Repositories.MappingRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.TeacherRepository;

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
        ICategoryRepository Category { get; }
        IEventRepository Event { get; }
        IJudgeRepository Judge { get; }
        ICriteriaRepository Criteria { get; }
        IMappingRepository Mapping { get; }
        ICriteriaTemplateRepository CriteriaTemplate { get; }
       
        Task SaveAsync();
    }
}
