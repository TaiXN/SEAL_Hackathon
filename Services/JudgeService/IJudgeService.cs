using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.JudgeService
{
    public interface IJudgeService
    {
        Task<bool> AddJudge(string mentorID, string trackID);
        Task<List<TeacherList>> GetAllTracksAsync();
        Task<List<TeacherList>> GetJudgesByTrackAsync(string trackID);
        Task<bool> RemoveJudge(string teacherID, string trackID);
    }
}
