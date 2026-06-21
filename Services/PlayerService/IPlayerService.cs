using APIViewModels.Auth; 

namespace Services.PlayerService
{
    public interface IPlayerService
    {
        Task<bool> RegisterPlayerAsync(RegisterAPIViewModel request);

        Task<bool> ApprovePlayerAsync(string studentId);
    }
}