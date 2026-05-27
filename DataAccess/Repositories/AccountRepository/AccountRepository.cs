using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.AccountRepository
{
    public class AccountRepository:Repository<Account>, IAccountRepository
    {
        private readonly SealHackathonContext _db;
        public AccountRepository(SealHackathonContext db):base(db) 
        {
            _db = db;
        }

        public void Update(Account account)
        {
            _db.Accounts.Update(account);
        }
    }
}
