using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.CategoryService
{
    public interface ICategoryService
    {
        Task<bool> CreateCategoryAsync(Category newCategory);
        Task<List<Category>> GetAllCategorysAsync();
        Task<Category> GetCategoryByIdAsync(string categoryID);
        Task<bool> UpdateCategoryAsync(Category categoryToUpdate);
        Task<bool> DeleteCategoryAsync(string categoryID);

    }
}
