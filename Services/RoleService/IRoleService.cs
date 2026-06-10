using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.RoleService
{
    public interface IRoleService
    {
        Task<Role> GetByRoleId(string roleId);
    }
}
