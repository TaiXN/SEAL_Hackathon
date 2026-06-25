using APIViewModels.TeamProject;
using System.Threading.Tasks;

namespace Services.SubmittedTeamService
{
    public interface ISubmittedTeamService
    {
        //Task<bool> SubmitTopicAsync(string accountId, string teamId, SubmitProjectAPIViewModel request);
        Task<bool> SubmitUrlAsync(string accountId, string teamId, SubmitGithubAPIViewModel request);
    }
}