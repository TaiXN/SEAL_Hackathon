using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using DataAccess.Repositories.RoundRepository;
using DataAccess.Repositories.TeacherRepository;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeacherListRepository
{
    public class TeacherListRepository : Repository<TeacherList>, ITeacherListRepository
    {
        private readonly SealContext _db;
        public TeacherListRepository(SealContext db) : base(db)
        {
            _db = db;

        }
        public void Update(TeacherList teacherList)
        {
            _db.TeacherLists.Update(teacherList);
        }
    }
}
