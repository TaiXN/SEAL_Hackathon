using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;

namespace Services.JudgeService
{
    public class JudgeService : IJudgeService
    {
        private readonly IUnitOfWork _uow;
        public JudgeService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<bool> AddJudge(string judgeID, string trackID)
        {
            try
            {
                TeacherList newJudge = new TeacherList()
                {
                    TeacherId = judgeID,
                    TrackId = trackID,
                    IsMentor = false
                };

                await _uow.TeacherList.AddAsync(newJudge);

                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<TeacherList>> GetAllTracksAsync()
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.IsMentor == false);
                return result.ToList();
            }
            catch
            {
                return new List<TeacherList>();
            }
        }

        public async Task<List<TeacherList>> GetJudgesByTrackAsync(string trackID)
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.TrackId == trackID && q.IsMentor == false);
                return result.ToList();
            }
            catch
            {
                return new List<TeacherList>();
            }
        }

        public async Task<bool> RemoveJudge(string teacherID, string trackID)
        {
            try
            {
                TeacherList listDb = await _uow.TeacherList.GetFirstOrDefaultAsync(q => q.TeacherId == teacherID && q.TrackId == trackID && q.IsMentor == false);

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

