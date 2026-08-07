using APIViewModels.Submission;
using APIViewModels.TeamProject;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.SubmissionService
{
    public interface ISubmissionService
    {
        Task<bool> SubmitUrlAsync(string accountId, string teamId, string eventId, SubmitGithubAPIViewModel request);
        Task<List<SubmissionAuditLogAPIViewModel>> GetAuditLogsByTeamAsync(string teamId);
        Task<List<SubmissionAPIViewModel>> GetAllSubmissionsAsync();
    }
}
