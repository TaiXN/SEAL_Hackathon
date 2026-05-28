using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.CategoryService
{
    public class CategoryService:ICategoryService
    {
        private readonly IUnitOfWork _uow;
        public CategoryService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateCategoryAsync(Category newCategory)
        {
            try
            {
                await _uow.Category.AddAsync(newCategory);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<List<Category>> GetAllCategorysAsync()
        {
            try
            {
                var result = await _uow.Category.GetAllAsync();
                return result.ToList();
            }
            catch
            {
                return new List<Category>();
            }
        }

        public async Task<Category> GetCategoryByIdAsync(string categoryID)
        {
            try
            {
                return await _uow.Category.GetFirstOrDefaultAsync(e => e.CategoryId == categoryID);
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateCategoryAsync(Category categoryToUpdate)
        {
            try
            {
                _uow.Category.Update(categoryToUpdate);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteCategoryAsync(string categoryID)
        {
            try
            {
                var cate = await _uow.Category.GetFirstOrDefaultAsync(e => e.CategoryId.Equals(categoryID));

                if (cate == null) return false;

                cate.IsActive = false;

                _uow.Category.Update(cate);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}
