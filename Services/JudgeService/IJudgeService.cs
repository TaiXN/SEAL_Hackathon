using APIViewModels.Judge;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.JudgeService
{
    public interface IJudgeService
    {
        Task<bool> AddJudge(string judgeId, string trackID);
        Task<List<JudgeAPIViewModel>> GetAllJudgeAsync();
        Task<List<JudgeAPIViewModel>> GetJudgesByTrackAsync(string trackID);
        Task<bool> RemoveJudge(string teacherID, string trackID);
    }
}
