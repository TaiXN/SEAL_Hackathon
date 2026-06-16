using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.TeacherService
{
    public interface ITeacherService
    {
        Task<bool> CreateAsync(Account account, bool isGuest);
    }
}
