using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.AccountRepository
{
    public interface IAccountRepository:IRepository<Account>
    {
        void Update(Account account);
    }
}
