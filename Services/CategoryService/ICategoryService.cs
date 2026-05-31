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
        
        Task<List<BasicCategoryAPIViewModel>> GetAllByEventIdAsync(string id);
        Task<List<BasicCategoryAPIViewModel>> GetAllByEventIdAsync(string id, bool isActive);
    }
}
