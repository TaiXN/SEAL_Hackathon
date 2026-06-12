using APIViewModels.TeacherList;
using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.TeacherListService
{
    public interface ITeacherListService
    {
        Task<bool> CreateTeacherListAsync(CreateTeacherListAPIViewModel info);
        Task<List<TeacherList>> GetTeachersByTrackIdAsync(string trackID);
        Task<bool> UpdateTeacherListAsync(string teacherId, string trackId, UpdateTeacherListAPIViewModel info);
        Task<bool> RemoveTeacherFromTrackAsync(string teacherId, string trackId);

    }
}
