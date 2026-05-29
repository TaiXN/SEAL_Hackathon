using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
using DataAccess.Repositories.AdminRepository;
using DataAccess.Repositories.CategoryRepository;
using DataAccess.Repositories.EventRepository;
using DataAccess.Repositories.JudgeRepository;
using DataAccess.Repositories.RefreshTokenRepository;
using DataAccess.Repositories.RoleRepository;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.TeacherRepository;

namespace DataAccess.Repositories.UnitOfWork
{
    public class UnitOfWork:IUnitOfWork
    {
        private readonly SealContext _context;
        public IAccountRepository Account { get; private set; }
        public IRoleRepository Role { get; private set; }
        public IRefreshTokenRepository RefreshToken { get; private set; }
        public IAdminRepository Admin { get; private set; }
        public ITeacherRepository Teacher { get; private set; }
        public IEventRepository Event { get; private set; }
        public IRoundRepository Round { get; private set; }
        public ICategoryRepository Category { get; private set; }
        public IJudgeRepository Judge { get; private set; }

        public UnitOfWork(SealContext context)
        {
            _context = context;
            Account = new AccountRepository.AccountRepository(context);
            Role = new RoleRepository.RoleRepository(context);
            RefreshToken = new RefreshTokenRepository.RefreshTokenRepository(context);
            Admin = new AdminRepository.AdminRepository(context);
            Teacher = new TeacherRepository.TeacherRepository(context);
            Event = new EventRepository.EventRepository(context);
           
            Round = new RoundRepository.RoundRepository(context);
            Category = new CategoryRepository.CategoryRepository(context);
            Judge = new JudgeRepository.JudgeRepository(context);
        }

        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
