using APIViewModels.University;

namespace Services.UniversityService
{
    public interface IUniversityService
    {
        Task<List<UniversityAPIViewModel>> GetAllUniversitiesAsync();
    }
}