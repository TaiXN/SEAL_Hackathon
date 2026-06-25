using APIViewModels.University;
using DataAccess.Entities;
using DataAccess.Repositories.UnitOfWork;

namespace Services.UniversityService
{
    public class UniversityService : IUniversityService
    {
        private readonly IUnitOfWork _uow;

        public UniversityService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<List<UniversityAPIViewModel>> GetAllUniversitiesAsync()
        {
            // Lấy toàn bộ danh sách trường ĐH từ Database
            var universities = await _uow.University.GetAllAsync();

            // Map sang ViewModel để trả về cho Frontend
            return universities.Select(u => new UniversityAPIViewModel
            {
                UniversityId = u.UniversityId,
                UniversityName = u.UniversityName // Hoặc tên cột tương ứng trong DB của sếp
            }).ToList();
        }

        public async Task<UniversityAPIViewModel> GetUniversityByIdAsync(string id)
        {
            try
            {
                University uniDb = await _uow.University.GetFirstOrDefaultAsync(q => q.UniversityId == id);

                if (uniDb == null) return null;

                UniversityAPIViewModel result = new UniversityAPIViewModel()
                {
                    UniversityId = uniDb.UniversityId,
                    UniversityName = uniDb.UniversityName
                };

                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public async Task<bool> CreateUniversityAsync(UniversityAPIViewModel info)
        {
            try
            {
                University checkDuplicate = await _uow.University.GetFirstOrDefaultAsync(q => q.UniversityName.Trim() == info.UniversityName.Trim());
                if (checkDuplicate != null) return false;

                University newUni = new University()
                {
                   
                    UniversityId = Guid.NewGuid().ToString(),
                    UniversityName = info.UniversityName.Trim(),
                };

                await _uow.University.AddAsync(newUni);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> UpdateUniversityAsync(UpdateUniversityAPIViewModel info)
        {
            try
            {
                University uniDb = await _uow.University.GetFirstOrDefaultAsync(q => q.UniversityId == info.UniversityID);

                if (uniDb == null) return false;

                University checkDuplicate = await _uow.University.GetFirstOrDefaultAsync(q =>
                    q.UniversityName.Trim() == info.UniversityName.Trim() &&
                    q.UniversityId != info.UniversityID);

                if (checkDuplicate != null) return false;

                uniDb.UniversityName = info.UniversityName.Trim();

                _uow.University.Update(uniDb);
                await _uow.SaveAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteUniversityAsync(string id)
        {
            try
            {
                University uniDb = await _uow.University.GetFirstOrDefaultAsync(u => u.UniversityId == id);

                if (uniDb == null) return false;

                _uow.University.Remove(uniDb);
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