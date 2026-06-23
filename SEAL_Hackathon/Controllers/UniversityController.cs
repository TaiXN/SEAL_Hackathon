using APIViewModels.University;
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

            if (result == null)
            {
                return NotFound("University not found.");
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(UniversityAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _university.CreateUniversityAsync(info);

                if (isSuccess)
                {
                    return Ok("Create university successfully.");
                }
                else
                {
                    return BadRequest("Create failed. Something went wrong.");
                }
            }
            return BadRequest(ModelState);
        }

        [HttpPut]
        public async Task<IActionResult> Update(UpdateUniversityAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                bool isSuccess = await _university.UpdateUniversityAsync(info);

                if (isSuccess)
                {
                    return Ok("Update university successfully.");
                }
                else
                {
                    return BadRequest("Update failed. University ID not found.");
                }
            }
            return BadRequest(ModelState);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            bool isSuccess = await _university.DeleteUniversityAsync(id);

            if (isSuccess)
            {
                return Ok("Delete university successfully.");
            }
            else
            {
                return BadRequest("Delete failed. University ID not found.");
            }
        }
    }
}