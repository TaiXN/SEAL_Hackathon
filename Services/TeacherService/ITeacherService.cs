using APIViewModels.Teacher;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.TeacherService
{
    public interface ITeacherService
    {
        Task<bool> CreateAsync(Account account, bool isGuest);
        Task<List<TeacherAPIViewModel>> GetAllAsync();
        Task<Teacher> GetByIdAsync(string id);
        Task<bool> UpdateAsync(string id, Account updatedAccount, bool isGuest);
        Task<bool> DeleteAsync(string id);

    }
}
