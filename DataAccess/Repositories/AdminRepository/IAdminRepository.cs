using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.AdminRepository
{
    public interface IAdminRepository:IRepository<Admin>
    {
        void Update(Admin admin);
    }
}
