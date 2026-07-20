using APIViewModels.Mentor;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace Services.MentorService
{
    public class MentorService : IMentorService
    {
        private readonly IUnitOfWork _uow;
        public MentorService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> AddMentor(string mentorID, string trackID)
        {
            try
            {
                TeacherList newMentor = new TeacherList()
                {
                    TeacherId = mentorID,
                    TrackId = trackID,
                    IsMentor = true
                };

                await _uow.TeacherList.AddAsync(newMentor);

                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<MentorAPIViewModel>> GetAllMentorsAsync()
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.IsMentor);

                return result.Select(m => new MentorAPIViewModel
                {
                    TeacherId = m.TeacherId,
                    TrackId = m.TrackId,
                    IsMentor = m.IsMentor
                }).ToList();
            }
            catch
            {
                return new List<MentorAPIViewModel>();
            }
        }

        public async Task<List<MentorAPIViewModel>> GetMentorsByTrackAsync(string trackID)
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.TrackId == trackID && q.IsMentor);

                return result.Select(m => new MentorAPIViewModel
                {
                    TeacherId = m.TeacherId,
                    TrackId = m.TrackId,
                    IsMentor = m.IsMentor
                }).ToList();
            }
            catch
            {
                return new List<MentorAPIViewModel>();
            }
        }

        public async Task<bool> RemoveMentor(string teacherID, string trackID)
        {
            try
            {
                TeacherList listDb = await _uow.TeacherList.GetFirstOrDefaultAsync(q => q.TeacherId == teacherID && q.TrackId == trackID && q.IsMentor);

                if (listDb == null)
                {
                    return false;
                }

                _uow.TeacherList.Remove(listDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (System.Exception ex)
            {
                return false;
            }
        }
    }
}
