using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.StudentRepository
{
    public class StudentRepository : Repository<Student>, IStudentRepository
    {
        private readonly SealHackathonContext _db;
        public StudentRepository(SealHackathonContext db) : base(db) {
            _db = db;
        }
        public void Update(Student student) {
            _db.Students.Update(student);
        }
    }
}