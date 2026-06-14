using APIViewModels.TeacherList;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;

namespace Services.TeacherListService
{
    public class TeacherListService : ITeacherListService
    {
        private readonly IUnitOfWork _uow;

        public TeacherListService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> CreateTeacherListAsync(CreateTeacherListAPIViewModel info)
        {
            try
            {
                TeacherList existingList = await _uow.TeacherList.GetFirstOrDefaultAsync(t => t.TeacherId == info.TeacherID && t.TrackId == info.TrackID);

                if (existingList != null)
                {
                    return false;
                }

                TeacherList newList = new TeacherList()
                {
                    TeacherId = info.TeacherID,
                    TrackId = info.TrackID,
                    IsMentor = info.IsMentor,
                };

                await _uow.TeacherList.AddAsync(newList);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<TeacherList>> GetTeachersByTrackIdAsync(string trackID)
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(e => e.TrackId == trackID);
                return result.ToList();
            }
            catch
            {
                return new List<TeacherList>();
            }
        }

        public async Task<bool> UpdateTeacherListAsync(string teacherId, string trackId,UpdateTeacherListAPIViewModel info)
        {
            try
            {
                TeacherList listDb = await _uow.TeacherList.GetFirstOrDefaultAsync(e => e.TeacherId == teacherId && e.TrackId == trackId);
                if (listDb == null) return false;

                listDb.IsMentor = info.IsMentor;

                _uow.TeacherList.Update(listDb);
                await _uow.SaveAsync();
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> RemoveTeacherFromTrackAsync(string teacherId, string trackId)
        {
            try
            {
                TeacherList listDb = await _uow.TeacherList.GetFirstOrDefaultAsync(e => e.TeacherId == teacherId && e.TrackId == trackId);
                if (listDb == null) return false;

                _uow.TeacherList.Remove(listDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}
