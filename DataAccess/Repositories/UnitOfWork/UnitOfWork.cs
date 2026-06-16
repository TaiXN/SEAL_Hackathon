using DataAccess.Entities;
using DataAccess.Repositories.AccountRepository;

using DataAccess.Repositories.EventRepository;

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

using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.UnitOfWork
{
    public class UnitOfWork:IUnitOfWork
    {
        private readonly SealContext _context;
        public IAccountRepository Account { get; private set; }
        public IRoleRepository Role { get; private set; }
        public IRefreshTokenRepository RefreshToken { get; private set; }
        public IEventRepository Event { get; private set; }
        public IRoundRepository Round { get; private set; }
        public ITeamRepository Team { get; private set; }
        public IStudentRepository Student { get; private set; }
        public ITeamMemberRepository TeamMember { get; private set; }
        public ITeamInRoundRepository TeamInRound { get; private set; }
        public ITrackRepository Track { get; private set; }
        public ITopicRepository Topic { get; private set; }
        public ISubmissionRepository Submission { get; private set; }




        public UnitOfWork(SealContext context)
        {
            _context = context;
            Account = new AccountRepository.AccountRepository(context);
            Role = new RoleRepository.RoleRepository(context);
            RefreshToken = new RefreshTokenRepository.RefreshTokenRepository(context);
            
            Event = new EventRepository.EventRepository(context);
           
            Round = new RoundRepository.RoundRepository(context);
            Team = new TeamRepository.TeamRepository(context);
            Student = new StudentRepository.StudentRepository(context);
            TeamMember = new TeamMemberRepository.TeamMemberRepository(context);
            TeamInRound = new TeamInRoundRepository.TeamInRoundRepository(context);
            Submission = new SubmissionRepository.SubmissionRepository(context);
            Track = new TrackRepository.TrackRepository(context);
            Topic = new TopicRepository.TopicRepository(context);



        }

        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
