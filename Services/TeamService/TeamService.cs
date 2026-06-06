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

        public async Task<bool> CreateTeamAsync(string accountId, string teamName)
        {
            if (string.IsNullOrWhiteSpace(teamName))
            {
                throw new Exception("Team name cannot be empty");
            }

            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            if (player == null) return false;

            if (player.UserTeams != null && player.UserTeams.Any())
            {
                return false;
            }

            string newTeamId = Guid.NewGuid().ToString();

            var leaderMapping = new UserTeam
            {
                TeamId = newTeamId,
                PlayerId = player.PlayerId,
                IsLeader = true,
                InviteStatus = true
            };

            var newTeam = new Team
            {
                TeamId = newTeamId,
                TeamName = teamName,
                UserTeams = new List<UserTeam> { leaderMapping }
            };

            await _uow.Team.AddAsync(newTeam);
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
            if (memberRecord == null) throw new Exception("You are not in this team.");

            // Đếm xem team còn bao nhiêu người
            var teamMembers = await _uow.UserTeam.GetAllAsync();
            var count = teamMembers.Count(ut => ut.TeamId == teamId);

            // 3. Nếu là LEADER đòi out
            if (memberRecord.IsLeader == true)
            {
                if (count > 1)
                {
                    // Trường hợp A: Nhóm đông người -> Bắt buộc nhường ngôi
                    throw new Exception("You are the team leader. Please transfer the leader role to someone else before leaving.");
                }
                else
                {
                    // Trường hợp B: Nhóm CÓ 1 MÌNH -> GIẢI TÁN LUÔN ĐỘI THI

                    // B1. Xóa đơn đăng ký đề tài (nếu đã nộp)
                    var submittedRecord = await _uow.SubmittedTeam.GetFirstOrDefaultAsync(s => s.TeamId == teamId);
                    if (submittedRecord != null)
                    {
                        _uow.SubmittedTeam.Remove(submittedRecord);
                    }

                    // B2. Xóa thành viên cuối cùng
                    _uow.UserTeam.Remove(memberRecord);

                    // B3. Xóa sổ luôn cái Đội
                    var teamToDelete = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
                    if (teamToDelete != null)
                    {
                        _uow.Team.Remove(teamToDelete);
                    }

                    await _uow.SaveAsync();
                    return true; // Giải tán thành công!
                }
            }

            // 4. Nếu chỉ là thành viên bình thường (Member) thì cứ xách balo lên và đi thôi
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

            // 2. Tìm Team
            var team = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null) return null;

            // 3. ĐI TÌM TRACK & TOPIC (TỪ BẢNG SUBMITTED TEAM)
            string categoryName = "Not selected yet";

            // Tìm xem team này đã nộp đơn vào SubmittedTeam chưa
            var submittedProject = await _uow.SubmittedTeam.GetFirstOrDefaultAsync(st => st.TeamId == teamId);

            // Dùng TrackId thay vì CategoryId
            if (submittedProject != null && !string.IsNullOrEmpty(submittedProject.TrackId))
            {
                // Gọi _uow.Track thay vì _uow.Category
                var track = await _uow.Track.GetFirstOrDefaultAsync(c => c.TrackId == submittedProject.TrackId);
                if (track != null)
                {
                    // Nối tên Track và Topic lại để Frontend hiển thị cho đẹp
                    categoryName = track.TrackName;

                    // ĐÃ FIX: Dùng TopicId để chọc xuống DB lấy TopicDetail, không xài TopicName nữa!
                    if (!string.IsNullOrEmpty(submittedProject.TopicId))
                    {
                        var topic = await _uow.Topic.GetFirstOrDefaultAsync(t => t.TopicId == submittedProject.TopicId);
                        if (topic != null)
                        {
                            categoryName += " - " + topic.TopicDetail;
                        }
                    }
                }
            }

            // 4. Đếm số thành viên
            var allMembers = await _uow.UserTeam.GetAllAsync();
            int memberCount = allMembers.Count(ut => ut.TeamId == teamId);

            // 5. Trả kết quả về cho Frontend
            return new TeamDashboardViewModel
            {
                TeamName = team.TeamName,
                CategoryName = categoryName, // Trả về dạng: "Tên Track - Tên Topic"
                TotalMembers = memberCount
            };
        }


        public async Task<bool> UpdateTeamInfoAsync(string accountId, UpdateTeamAPIViewModel request)
        {
            // 1. Find the player and their current team
            var player = await _uow.Player.GetFirstOrDefaultAsync(p => p.AccountId == accountId, "UserTeams");
            if (player == null || player.UserTeams == null || !player.UserTeams.Any())
            {
                throw new Exception("You are not in any team!");
            }

            var myTeamInfo = player.UserTeams.FirstOrDefault();

            // 2. Enforce the Leader rule
            if (!myTeamInfo.IsLeader)
            {
                throw new Exception("Only the Team Leader can update the team information.");
            }

            // 3. (Optional) Check if they already submitted a project
            var existingSubmit = await _uow.SubmittedTeam.GetFirstOrDefaultAsync(s => s.TeamId == myTeamInfo.TeamId);
            if (existingSubmit != null)
            {
                throw new Exception("You cannot change the team name after submitting your project to the judges.");
            }

            // 4. Fetch the actual Team record and update it
            var teamToUpdate = await _uow.Team.GetFirstOrDefaultAsync(t => t.TeamId == myTeamInfo.TeamId);
            if (teamToUpdate != null)
            {
                teamToUpdate.TeamName = request.TeamName;

                _uow.Team.Update(teamToUpdate);
                await _uow.SaveAsync();
                return true;
            }

            return false;
        }





    }
}
