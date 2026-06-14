    using APIViewModels.TeamProject;
    using System.Threading.Tasks;

    namespace Services.SubmittedTeamService
    {
        public interface ISubmittedTeamService
        {
            Task<bool> SubmitTopicAsync(string accountId, SubmitProjectAPIViewModel request);

            Task<bool> SubmitGithubUrlAsync(string accountId, SubmitGithubAPIViewModel request);
    }
    }