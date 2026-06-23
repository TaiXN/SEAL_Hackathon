using APIViewModels.University;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Services.UniversityService
{
    public interface IUniversityService
    {
        Task<List<UniversityAPIViewModel>> GetAllUniversitiesAsync();
    }
}