using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

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
