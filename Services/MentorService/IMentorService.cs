using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.MentorService
{
    public interface IMentorService
    {
        Task<bool> AddMentor(string mentorID, string trackID);
        Task<List<TeacherList>> GetAllTracksAsync();
        Task<List<TeacherList>> GetMentorsByTrackAsync(string trackID);
        Task<bool> RemoveMentor(string teacherID, string trackID);

    }
}
