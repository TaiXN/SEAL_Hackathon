using APIViewModels.TeamProject;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.SubmissionService
{
    public interface ISubmissionService
    {
        Task<bool> SubmitUrlAsync(string accountId, string teamId, SubmitGithubAPIViewModel request);
    }
}
