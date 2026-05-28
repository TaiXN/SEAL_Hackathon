using DataAccess.Entities;
using DataAccess.Repositories.PrizeRepository;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.CategoryRepository
{
    public class CategoryRepository : Repository<Category>, ICategoryRepository
    {
        private readonly SealContext _db;
        public CategoryRepository(SealContext db) : base(db)
        {
            _db = db;

        }
        public void Update(Category category)
        {
            _db.Categories.Update(category);
        }
    }
}
