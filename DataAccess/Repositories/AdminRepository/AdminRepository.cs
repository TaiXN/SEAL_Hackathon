using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.AdminRepository
{
    public class AdminRepository:Repository<Admin>,IAdminRepository
    {
        private readonly SealContext _db;
        public AdminRepository(SealContext db):base(db) 
        {
            _db = db;
            
        }
        public void Update(Admin admin)
        {
            _db.Admins.Update(admin);
        }
    }
}
