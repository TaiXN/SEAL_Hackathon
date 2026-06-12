using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeacherListRepository
{
    public interface ITeacherListRepository : IRepository<TeacherList>
    {
        void Update(TeacherList teacherList);
    }
}
