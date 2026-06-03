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
            // 1. Find the player who called the API
            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            if (player == null || player.UserTeams == null || !player.UserTeams.Any())
            {
                throw new Exception("You are not currently in any team!");
            }

            // 2. Verify that the requester is the Team Leader
            var currentTeamMapping = player.UserTeams.FirstOrDefault(ut => ut.IsLeader == true);
            if (currentTeamMapping == null)
            {
                throw new Exception("Only the Team Leader can select the Topic and Track!");
            }

            string teamId = currentTeamMapping.TeamId;

            // 3. Count current team members BEFORE allowing topic selection
            var allMembers = await _uow.UserTeam.GetAllAsync();
            var memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            // THE MINIMUM 3 MEMBERS RULE GOES HERE!
            if (memberCount < 3)
            {
                throw new Exception($"Your team currently has {memberCount} member(s). You must have at least 3 members to select a Track & Topic! Please invite more teammates.");
            }

            // 4. Find the team to update
            Team team = await _uow.Team.GetAsync(teamId);
            if (team == null)
            {
                throw new Exception("The team does not exist!");
            }

            // 5. Update the CategoryId (Topic/Track)
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

        

        public async Task<DateTime?> GetCountdownDeadlineAsync()
        {
            // Lấy tất cả các vòng thi từ Database
            var rounds = await _uow.Round.GetAllAsync();

            // Lọc ra vòng thi chưa kết thúc và lấy cái gần nhất
            var currentRound = rounds
                .Where(r => r.EndDate > DateTime.Now)
                .OrderBy(r => r.EndDate)
                .FirstOrDefault();

            // Nếu có vòng thi thì trả về EndDate, không thì trả về null
            return currentRound?.EndDate;
        }

        public async Task<bool> KickMemberAsync(string teamId, string memberToKickPlayerId, string requesterAccountId)
        {
            // 1. Tìm PlayerID của cái người đang bấm nút Kick (lấy từ Token)
            var requester = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == requesterAccountId);
            if (requester == null)
            {
                throw new Exception("cant find player information");
            }

            // 2. Kiểm tra xem người thao tác có đúng là Leader của đội này không
            var leaderCheck = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.PlayerId == requester.PlayerId);
            if (leaderCheck == null || leaderCheck.IsLeader == false)
            {
                throw new Exception("only Team Leader allow to kick other players");
            }

            // 3. Ngăn chặn Leader tự đá chính mình
            if (requester.PlayerId == memberToKickPlayerId)
            {
                throw new Exception("you cant kick yourself, please transfer team leader to someone else ");
            }

            // 4. Tìm cái dòng của thành viên xấu số chuẩn bị bị kick
            var memberToRemove = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.PlayerId == memberToKickPlayerId);
            if (memberToRemove == null)
            {
                throw new Exception("member doesnt exist");
            }

            // 5. Chính thức "trảm" - Xóa khỏi bảng User_Team
            _uow.UserTeam.Remove(memberToRemove); // Tùy hàm Repo của nhóm ông, có thể là Delete()
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> LeaveTeamAsync(string teamId, string requesterAccountId)
        {
            // 1. Tìm thông tin người đang đòi out team
            var requester = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == requesterAccountId);

            // 2. Tìm cái dòng của người này trong đội
            var memberRecord = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.PlayerId == requester.PlayerId);
            if (memberRecord == null) throw new Exception("you not in this team");

            // 3. Nếu là Leader đòi out, bắt buộc phải nhường chức hoặc team chỉ còn 1 mình
            if (memberRecord.IsLeader == true)
            {
                // Đếm xem team còn ai không
                var teamMembers = await _uow.UserTeam.GetAllAsync();
                var count = teamMembers.Count(ut => ut.TeamId == teamId);

                if (count > 1)
                    throw new Exception("you are the team leader. please transfer leader role to someone else");
            }

            // 4. Xóa khỏi đội
            _uow.UserTeam.Remove(memberRecord);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> TransferLeaderRoleAsync(string teamId, string newLeaderPlayerId, string requesterAccountId)
        {
            // 1. Get the profile of the person making the request
            var requester = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == requesterAccountId);
            if (requester == null)
            {
                throw new Exception("Requester player profile not found!");
            }

            // 2. Prevent the leader from transferring the role to themselves
            if (requester.PlayerId == newLeaderPlayerId)
            {
                throw new Exception("You are already the leader of this team!");
            }

            // 3. Verify that the requester is currently the Leader of this team
            var currentLeaderRecord = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.PlayerId == requester.PlayerId);
            if (currentLeaderRecord == null || currentLeaderRecord.IsLeader == false)
            {
                throw new Exception("Only the current Team Leader can transfer the leadership role!");
            }

            // 4. Verify that the target new leader is actually a member of this team
            var newLeaderRecord = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.PlayerId == newLeaderPlayerId);
            if (newLeaderRecord == null)
            {
                throw new Exception("The selected member is not currently in this team!");
            }

            // 5. Swap the roles (Take the crown from current leader, give to the new leader)
            currentLeaderRecord.IsLeader = false;
            newLeaderRecord.IsLeader = true;

            // 6. Update the database and save changes
            _uow.UserTeam.Update(currentLeaderRecord);
            _uow.UserTeam.Update(newLeaderRecord);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<bool> JoinTeamDirectlyAsync(string teamId, string requesterAccountId)
        {
            // Define the maximum allowed members per team
            int MAX_TEAM_SIZE = 5;

            // 1. Get the player profile of the user trying to join
            var requester = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == requesterAccountId);
            if (requester == null) throw new Exception("Player profile not found!");

            // 2. Check if the target team actually exists
            var targetTeam = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (targetTeam == null) throw new Exception("The team does not exist!");

            // 3. Check if the player is already in THIS team
            var existingRecord = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.TeamId == teamId && ut.PlayerId == requester.PlayerId);
            if (existingRecord != null)
            {
                throw new Exception("You are already a member of this team!");
            }

            // 4. (Crucial) Check if the player is already in ANOTHER team
            var inAnotherTeam = await _uow.UserTeam.GetFirstOrDefaultAsync(ut => ut.PlayerId == requester.PlayerId);
            if (inAnotherTeam != null)
            {
                throw new Exception("You are already in a team! Please leave your current team before joining a new one.");
            }

            // 5. Check if the team is already full
            var allUserTeams = await _uow.UserTeam.GetAllAsync();
            var currentMemberCount = allUserTeams.Count(ut => ut.TeamId == teamId);

            if (currentMemberCount >= MAX_TEAM_SIZE)
            {
                throw new Exception($"This team is already full! (Maximum {MAX_TEAM_SIZE} members allowed)");
            }

            // 6. Join successfully! 
            var newMember = new UserTeam
            {
                TeamId = teamId,
                PlayerId = requester.PlayerId,
                IsLeader = false,
                InviteStatus = true // Skip approval, join immediately
            };

            await _uow.UserTeam.AddAsync(newMember);
            await _uow.SaveAsync();

            return true;
        }

        public async Task<TeamDashboardViewModel> GetMyTeamDashboardAsync(string accountId)
        {
            // 1. Tìm thông tin Player
            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            if (player == null || player.UserTeams == null || !player.UserTeams.Any())
            {
                return null; // Không có trong team nào
            }

            string teamId = player.UserTeams.FirstOrDefault().TeamId;

            // 2. Tìm Team (XÓA BỎ CÁI includeProperties: "Category" ĐI)
            var team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return null;

            // 3. Tự thân vận động đi tìm Category Name
            string categoryName = "Not selected yet";

            // Nếu Đội trưởng đã chọn Category rồi (ID không bị rỗng)
            if (!string.IsNullOrEmpty(team.CategoryId))
            {
                var category = await _uow.Category.GetFirstOrDefaultAsync(c => c.CategoryId == team.CategoryId);
                if (category != null)
                {
                    categoryName = category.CategoryName; // Lấy đúng tên in ra
                }
            }

            // 4. Đếm số thành viên
            var allMembers = await _uow.UserTeam.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            // 5. Trả kết quả về cho Frontend
            return new TeamDashboardViewModel
            {
                TeamName = team.TeamName,
                CategoryName = categoryName,
                Description = team.Description,
                TotalMembers = memberCount
            };
        }



    }
}
