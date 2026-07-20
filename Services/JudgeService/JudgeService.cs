using APIViewModels.Judge;
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

        public async Task<bool> AddJudge(string judgeId, string trackID)
        {
            try
            {
                TeacherList newJudge = new TeacherList()
                {
                    TeacherId = judgeId,
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

        public async Task<List<JudgeAPIViewModel>> GetAllJudgeAsync()
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.IsMentor == false);
                return result.Select(q => new JudgeAPIViewModel
                {
                    TeacherId = q.TeacherId,
                    TrackId = q.TrackId,
                    IsMentor = q.IsMentor
                }).ToList();
            }
            catch 
            {
                return new List<JudgeAPIViewModel>();
            }
        }

        public async Task<List<JudgeAPIViewModel>> GetJudgesByTrackAsync(string trackID)
        {
            try
            {
                List<TeacherList> result = await _uow.TeacherList.GetAllAsync(q => q.TrackId == trackID && q.IsMentor == false);

                return result.Select(q => new JudgeAPIViewModel
                {
                    TeacherId = q.TeacherId,
                    TrackId = q.TrackId,
                    IsMentor = q.IsMentor
                }).ToList();
            }
            catch
            {
                return new List<JudgeAPIViewModel>();
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

