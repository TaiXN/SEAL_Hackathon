using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RoleRepository
{
    public class RoleRepository:Repository<Role>, IRoleRepository
    {
        private readonly SealContext _db;
        public RoleRepository(SealContext db):base(db)
        {
            _db = db;
        }
       
    }
}
