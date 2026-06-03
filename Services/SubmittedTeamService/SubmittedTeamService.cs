using APIViewModels.TeamProject;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Services.SubmittedTeamService
{
    public class SubmittedTeamService : ISubmittedTeamService
    {
        private readonly IUnitOfWork _uow;

        public SubmittedTeamService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> SubmitTopicAsync(string accountId, SubmitProjectAPIViewModel request)
        {
            // 1. Tìm thông tin Player và xem họ đang ở Đội nào
            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            if (player == null || player.UserTeams == null || !player.UserTeams.Any())
            {
                throw new Exception("you not in any team");
            }

            var myTeamInfo = player.UserTeams.FirstOrDefault();

            // 2. Chặn quyền: Chỉ Đội trưởng mới được nộp
            if (!myTeamInfo.IsLeader)
            {
                throw new Exception("only Leader can submit");
            }

            string teamId = myTeamInfo.TeamId;

            // 3. Luật Hackathon: Đội phải có ít nhất 3 thành viên
            var allMembers = await _uow.UserTeam.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);
            if (memberCount < 3)
            {
                throw new Exception("you must have atleast 3 members to submit");
            }

            // 4. Chống Spam: Check xem đội đã đăng ký chưa
            var existingSubmit = await _uow.SubmittedTeam.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (existingSubmit != null)
            {
                throw new Exception("you already submited");
            }

            // 5. Lưu xuống Database
            var newSubmit = new SubmittedTeam
            {
                SubmittedTeamId = Guid.NewGuid().ToString(),
                TeamId = teamId,
                CategoryId = request.CategoryId,
                TopicName = request.TopicName,
                Description = request.Description,
                SubmitTime = DateTime.Now
            };

            await _uow.SubmittedTeam.AddAsync(newSubmit);
            await _uow.SaveAsync();

            return true;
        }
    }
}