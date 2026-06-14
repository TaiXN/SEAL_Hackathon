using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;
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
    public class UnitOfWork : IUnitOfWork
    {
        private readonly SealContext _context;
        public IAccountRepository Account { get; private set; }
        public IRoleRepository Role { get; private set; }
        public IRefreshTokenRepository RefreshToken { get; private set; }
       
        public ITeacherRepository Teacher { get; private set; }
        public IEventRepository Event { get; private set; }
        public IRoundRepository Round { get; private set; }
        public ICriteriaRepository Criteria { get; private set; }
        public IMappingRepository Mapping { get; private set; }
        public ICriteriaSetRepository CriteriaSet { get; private set; }
        public ITrackRepository Track { get; private set; }
        public ITopicRepository Topic { get; private set; }
        public ITeacherListRepository TeacherList { get; private set; }


        public UnitOfWork(SealContext context)
        {
            _context = context;
            Account = new AccountRepository.AccountRepository(context);
            Role = new RoleRepository.RoleRepository(context);
            RefreshToken = new RefreshTokenRepository.RefreshTokenRepository(context);
         
            Teacher = new TeacherRepository.TeacherRepository(context);
            Event = new EventRepository.EventRepository(context);
            Round = new RoundRepository.RoundRepository(context);
            Criteria = new CriteriaRepository.CriteriaRepository(context);
            Mapping = new MappingRepository.MappingRepository(context);
            CriteriaSet = new CriteriaSetRepository.CriteriaSetRepository(context);
            Track = new TrackRepository.TrackRepository(context);
            Topic = new TopicRepository.TopicRepository(context);
            TeacherList = new TeacherListRepository.TeacherListRepository(context);

        }

        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
