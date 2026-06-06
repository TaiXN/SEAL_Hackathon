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
    public class UnitOfWork:IUnitOfWork
    {
        private readonly SealHackathonContext _context;
        public IAccountRepository Account { get; private set; }
        public IRoleRepository Role { get; private set; }
        public IRefreshTokenRepository RefreshToken { get; private set; }
        public IAdminRepository Admin { get; private set; }
        public ITeacherRepository Teacher { get; private set; }
        public IEventRepository Event { get; private set; }
        public IPrizeRepository Prize { get; private set; }
        public IRoundRepository Round { get; private set; }
        public ITeamRepository Team { get; private set; }
        public IPlayerRepository Player { get; private set; }
        public IUserTeamRepository UserTeam { get; private set; }
        public ISubmittedTeamRepository SubmittedTeam { get; private set; }
        public ITrackRepository Track { get; private set; }
        public ITopicRepository Topic { get; private set; }





        public UnitOfWork(SealHackathonContext context)
        {
            _context = context;
            Account = new AccountRepository.AccountRepository(context);
            Role = new RoleRepository.RoleRepository(context);
            RefreshToken = new RefreshTokenRepository.RefreshTokenRepository(context);
            Admin = new AdminRepository.AdminRepository(context);
            Teacher = new TeacherRepository.TeacherRepository(context);
            Event = new EventRepository.EventRepository(context);
            Prize = new PrizeRepository.PrizeRepository(context);
            Round = new RoundRepository.RoundRepository(context);
            Team = new TeamRepository.TeamRepository(context);
            Player = new PlayerRepository.PlayerRepository(context);
            SubmittedTeam = new SubmittedTeamRepository.SubmittedTeamRepository(context);
            UserTeam = new UserTeamRepository.UserTeamRepository(context);

            Track = new TrackRepository.TrackRepository(context);
            Topic = new TopicRepository.TopicRepository(context);



        }

        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
