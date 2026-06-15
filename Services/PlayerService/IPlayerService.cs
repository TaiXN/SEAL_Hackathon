using APIViewModels.Auth; // Adjust the using based on where your ViewModels are

namespace Services.PlayerService
{
    public interface IPlayerService
    {
        // Move the contracts from IAccountService to here
        Task<bool> RegisterPlayerAsync(RegisterAPIViewModel request);
        
    }
}