using APIViewModels.University;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.UniversityService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UniversityController : ControllerBase
    {
        private readonly IUniversityService _university;

        public UniversityController(IUniversityService university)
        {
            _university = university;
        }

        // Mở tự do để load Dropdown lúc đăng ký tài khoản
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            List<UniversityAPIViewModel> result = await _university.GetAllUniversitiesAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            UniversityAPIViewModel result = await _university.GetUniversityByIdAsync(id);
            if (result == null) return NotFound("University not found.");
            return Ok(result);
        }

        // ---> CHỈ ADMIN MỚI ĐƯỢC TẠO
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(UniversityAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _university.CreateUniversityAsync(info);
                if (isSuccess) return Ok("Create university successfully.");
                return BadRequest("Create failed. Something went wrong.");
            }
            return BadRequest(ModelState);
        }

        // ---> CHỈ ADMIN MỚI ĐƯỢC SỬA
        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<IActionResult> Update(UpdateUniversityAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _university.UpdateUniversityAsync(info);
                if (isSuccess) return Ok("Update university successfully.");
                return BadRequest("Update failed. University ID not found.");
            }
            return BadRequest(ModelState);
        }

        // ---> CHỈ ADMIN MỚI ĐƯỢC XÓA
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            bool isSuccess = await _university.DeleteUniversityAsync(id);
            if (isSuccess) return Ok("Delete university successfully.");
            return BadRequest("Delete failed. University ID not found.");
        }
    }
}