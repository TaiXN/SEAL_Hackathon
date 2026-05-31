using APIViewModels.Category;
using APIViewModels.Judge;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.JudgeService
{
    public interface IJudgeService
    {
        Task<List<JudgeAPIViewModel>> GetByCategoryIdAsync(string cateId, string eventId);
        Task<string> AddJudgeAsync(AddJudgeAPIViewModel judgesInfo);
        Task<bool> RemoveJudgeAsync(RemoveJudgeAPIViewModel judgeInfo);
    }
}
