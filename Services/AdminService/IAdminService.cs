using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.AdminService
{
    public interface IAdminService
    {
        Task<bool> CreateAsync(Account account);
    }
}
