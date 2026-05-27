using DataAccess.Entities;
using DataAccess.Repositories.RepositoryBase;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataAccess.Repositories.TeacherRepository
{
    public interface ITeacherRepository: IRepository<Teacher>
    {
        void Update(Teacher entity);
    }
}
