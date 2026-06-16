using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.StudentRepository
{
    public class StudentRepository : Repository<Student>, IStudentRepository
    {
        private readonly SealContext _db;
        public StudentRepository(SealContext db) : base(db) {
            _db = db;
        }
        public void Update(Student student) {
            _db.Students.Update(student);
        }
    }
}