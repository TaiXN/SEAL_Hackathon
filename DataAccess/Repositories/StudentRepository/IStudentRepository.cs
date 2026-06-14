using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;

namespace DataAccess.Repositories.StudentRepository
{
    public interface IStudentRepository : IRepository<Student>
    {
        void Update(Student student);
    }
}