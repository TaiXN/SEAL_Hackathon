using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RefreshTokenRepository
{
    public class RefreshTokenRepository:Repository<RefreshToken>,IRefreshTokenRepository
    {
        private readonly SealContext _db;
        public RefreshTokenRepository(SealContext db):base(db)
        {
            _db = db;
        }
        public void Update(RefreshToken entity)
        {
            _db.RefreshTokens.Update(entity);
        }
    }
}
