using APIViewModels.Auth;
using APIViewModels.Gmail;
using APIViewModels.Student;

namespace Services.PlayerService
{
    public interface IPlayerService
    {
        Task<bool> RegisterPlayerAsync(RegisterAPIViewModel request);

        Task<bool> ApprovePlayerAsync(string studentId);
        Task<List<StudentAPIViewModel>> GetPendingPlayersAsync();
        Task<bool> RejectPlayerAsync(string studentId);
        Task<bool> VerifyEmailOtpAsync(VerifyOtpAPIViewModel request);

    }
}