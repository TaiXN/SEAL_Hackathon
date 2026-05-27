using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace Services.RoleService
{
    public class RoleService:IRoleService
    {
        private readonly IUnitOfWork _uow;
        public RoleService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Role> GetByRoleId(string roleId)
        {
            return await _uow.Role.GetAsync(roleId);
        }
    }
}
