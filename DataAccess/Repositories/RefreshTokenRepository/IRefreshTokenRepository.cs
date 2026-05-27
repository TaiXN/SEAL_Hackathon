using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.RefreshTokenRepository
{
    public interface IRefreshTokenRepository:IRepository<RefreshToken>
    {
        void Update(RefreshToken entity);
    }
}
