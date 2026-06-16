using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeacherRepository
{
    public class TeacherRepository : Repository<Teacher>, ITeacherRepository
    {
        private readonly SealContext _db;
        public TeacherRepository(SealContext db) : base(db)
        {
            _db = db;
        }

        public void Update(Teacher entity)
        {
            _db.Teachers.Update(entity);
        }
    }
}
