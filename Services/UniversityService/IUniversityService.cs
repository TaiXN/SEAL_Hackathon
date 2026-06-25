using APIViewModels.University;

namespace Services.UniversityService
{
    public interface IUniversityService
    {
        Task<List<UniversityAPIViewModel>> GetAllUniversitiesAsync();
        Task<UniversityAPIViewModel> GetUniversityByIdAsync(string id);
        Task<bool> CreateUniversityAsync(UniversityAPIViewModel info);
        Task<bool> UpdateUniversityAsync(UpdateUniversityAPIViewModel info);
        Task<bool> DeleteUniversityAsync(string id);
    }
}