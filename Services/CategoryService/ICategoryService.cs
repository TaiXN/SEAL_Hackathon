using APIViewModels.Category;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.CategoryService
{
    public interface ICategoryService
    {

        Task<bool> CreateAsync(CreateCategoryAPIViewModel cateInfo, string creator);
        Task<bool> ChangeMentorAsync(ChangeMentorAPIViewModel mentorInfo);
        Task<string> AddJudgeAsync(AddJudgeAPIViewModel judgesInfo);
    }
}
