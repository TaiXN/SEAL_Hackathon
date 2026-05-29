using APIViewModels.Team;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using Microsoft.Identity.Client;
using System.Numerics;
namespace Services.TeamService
{
    public class TeamService : ITeamService
    {
        private readonly IUnitOfWork _uow;
        public TeamService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<List<MyTeamMemberViewModel>> GetMyTeamAsync(string accountId)
        {

            //who logged in
            // var player have player and UserTeams table
            var currentPlayer = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");



            if (currentPlayer == null || currentPlayer.UserTeams == null || !currentPlayer.UserTeams.Any())
            {
                return null;
            }
            //Kiểu_Dữ_Liệu Biến = Đối_Tượng.Danh_Sách.FirstOrDefault().Thuộc_Tính
            //FirstOrDefault: Chặn luồng hiện tại cho đến khi truy vấn hoàn tất
            string teamId = currentPlayer.UserTeams.FirstOrDefault().TeamId;

            //collect all members from the team
            //var player have player and UserTeams table
            //GetAllAsync: ko can phai Khởi tạo query -> Gắn Where -> Gắn Include -> ToListAsync
            var teamMembers = await _uow.Player.GetAllAsync(
                p => p.UserTeams.Any(ut => ut.TeamId == teamId),
                includeProperties: "UserTeams,Account");

            var result = new List<MyTeamMemberViewModel>();
            foreach (var member in teamMembers)
            {
                result.Add(new MyTeamMemberViewModel
                {
                    StudentId = member.StudentId,
                    Email = member.Account?.Email,
                    IsLeader = member.UserTeams.FirstOrDefault(ut => ut.TeamId == teamId)?.IsLeader ?? false
                });
            }
            return result;
        }
        public async Task<bool> SubmitTrackAsync(string accountId, string categoryId)
        {
            //who called api
            // get accountid and collect userTeams table
            //var player = await _uow.Player.GetFirstOrDefaultAsync( **filter condition** );
            // var player have player and UserTeams table

            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            // have userTeams created   //is it empty
            if (player == null || player.UserTeams == null || !player.UserTeams.Any())
            {
                return false;
            }


            var currentTeamMapping = player.UserTeams.FirstOrDefault(ut => ut.IsLeader == true);
            string teamId = currentTeamMapping.TeamId; // get TeamId from Mapping table

            // find teamId
            Team team = await _uow.Team.GetAsync(teamId);

            if (team == null)
            {
                return false;
            }

            // confirm shits
            team.CategoryId = categoryId;

            _uow.Team.Update(team);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> CreateTeamAsync(string accountId, string teamName, string categoryId, string description)
        {
            if (string.IsNullOrWhiteSpace(teamName) || string.IsNullOrWhiteSpace(categoryId))
            {
                throw new Exception("team name and track cant not be empty");
            }

            //var checkCategory = await _uow.Category.GetFirstOrDefaultAsync(c => c.CategoryId == categoryId);
            //if (checkCategory == null)
            //{
            //    throw new Exception("Hạng mục thi đấu này không tồn tại trên hệ thống!");
            //}

            // 1. Tìm thằng đang đăng nhập
            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            if (player == null) return false;

            // 2. Luật số 1: Đã có nhóm rồi thì nghỉ tạo nhóm mới!
            if (player.UserTeams != null && player.UserTeams.Any())
            {
                return false;
            }

            // 3. Chuẩn bị mã ID mới
            string newTeamId = Guid.NewGuid().ToString();

            // 4. Tạo hồ sơ chức vụ (Đội trưởng) - Ép kiểu bool cho InviteStatus
            var leaderMapping = new UserTeam
            {
                TeamId = newTeamId,
                PlayerId = player.PlayerId,
                IsLeader = true,
                InviteStatus = true // Sửa thành true cho hết báo lỗi convert int to bool
            };

            // 5. Khởi tạo Đội mới VÀ nhét luôn thằng Đội trưởng vào trong "Bụng" của cái Đội này
            var newTeam = new Team
            {
                TeamId = newTeamId,
                TeamName = teamName,
                CategoryId = categoryId,
                Description = description,
                // TUYỆT CHIÊU LÀ Ở ĐÂY: Khởi tạo danh sách UserTeams ngay lúc tạo Đội
                UserTeams = new List<UserTeam> { leaderMapping }
            };

            // 6. Lưu xuống Database (Lưu thằng Cha, EF Core sẽ tự động tìm và lưu luôn thằng Con)
            await _uow.Team.AddAsync(newTeam);

            // 7. Chốt đơn
            await _uow.SaveAsync();

            return true;
        }

        public async Task<List<APIViewModels.Team.LeaderboardViewModel>> GetLeaderboardAsync()
        {
            
            var teams = await _uow.Team.GetAllAsync();

            var leaderboard = teams
                .Select(t => new APIViewModels.Team.LeaderboardViewModel
                {
                    TeamId = t.TeamId,
                    TeamName = t.TeamName,
                    CategoryName = "Chưa load được do kẹt Database",
                    TotalScore = 0
                })
                .OrderByDescending(t => t.TotalScore)
                .ToList();

            return leaderboard;
        }

    }
}
