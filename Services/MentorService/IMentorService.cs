using APIViewModels.Mentor;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.MentorService
{
    public interface IMentorService
    {
        Task<bool> AddMentor(string mentorID, string trackID);
        Task<List<MentorAPIViewModel>> GetAllMentorsAsync();
        Task<List<MentorAPIViewModel>> GetMentorsByTrackAsync(string trackID);
        Task<bool> RemoveMentor(string teacherID, string trackID);
        Task<TeamMentorContactAPIViewModel> GetMentorContactByTeamAsync(string teamId);
        Task<List<MentorAssignedTeamAPIViewModel>> GetAssignedTeamsByMentorAsync(string mentorId);
    }
}
