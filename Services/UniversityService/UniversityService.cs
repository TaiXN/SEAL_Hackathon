using APIViewModels.University;
using DataAccess.Repositories.UnitOfWork;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
    }
}