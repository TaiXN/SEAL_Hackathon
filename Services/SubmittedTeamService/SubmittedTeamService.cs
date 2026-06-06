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
                throw new Exception("You are not currently in any team.");

            var myTeamInfo = player.UserTeams.FirstOrDefault();

            // 2. Chặn quyền: Chỉ Đội trưởng mới được nộp
            if (!myTeamInfo.IsLeader)
                throw new Exception("Only the Team Leader can submit the track and topic.");

            string teamId = myTeamInfo.TeamId;

            // 3. Luật Hackathon: Đội phải có ít nhất 3 thành viên
            var allMembers = await _uow.UserTeam.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);
            if (memberCount < 3)
                throw new Exception($"Your team must have at least 3 members. You currently have {memberCount}.");

            // 4. Chống Spam: Check xem đội đã đăng ký chưa
            var existingSubmit = await _uow.SubmittedTeam.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
            if (existingSubmit != null)
                throw new Exception("Your team has already submitted a track.");

            // 5. BẢO VỆ DATABASE: Kiểm tra Track có tồn tại VÀ CÓ ĐANG ACTIVE KHÔNG?
            // Thêm điều kiện t.IsActive == true
            var track = await _uow.Track.GetFirstOrDefaultAsync(t => t.TrackId == request.TrackId && t.IsActive == true);
            if (track == null)
                throw new Exception("Submit failed! The selected Track does not exist or is currently INACTIVE.");

            // 6. LUẬT MỚI: Tối đa 6 đội cho mỗi Track
            var currentSubmissionsInTrack = await _uow.SubmittedTeam.GetAllAsync(s => s.TrackId == request.TrackId);
            if (currentSubmissionsInTrack.Count() >= 6)
                throw new Exception("Submit failed! This Track has reached the maximum limit of 6 teams. Please choose another Track.");

            // 7. KIỂM TRA TOPIC: Có tồn tại, có thuộc Track này VÀ CÓ ĐANG ACTIVE KHÔNG?
            // Thêm điều kiện t.IsActive == true
            var topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == request.TopicId && t.TrackId == request.TrackId && t.IsActive == true);
            if (topic == null)
                throw new Exception("Submit failed! The selected Topic is invalid, inactive, or does not belong to this Track.");

            // 8. Lưu xuống Database
            var newSubmit = new SubmittedTeam
            {
                SubmittedTeamId = Guid.NewGuid().ToString(),
                TeamId = teamId,
                TrackId = request.TrackId,
                TopicId = request.TopicId,
                SubmitTime = DateTime.Now
            };

            await _uow.SubmittedTeam.AddAsync(newSubmit);
            await _uow.SaveAsync();

            return true;
        }
    }
}