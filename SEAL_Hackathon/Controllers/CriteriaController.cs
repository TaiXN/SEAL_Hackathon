using APIViewModels.Criteria;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.AdminService;
using Services.CriteriaService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CriteriaController : ControllerBase
    {
        private readonly ICriteriaService _criteria;
        private readonly IAdminService _admin;
        public CriteriaController(ICriteriaService criteria, IAdminService admin)
        {
            _criteria = criteria;
            _admin = admin;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("criterion")]
        public async Task<IActionResult> CreateCriterion(CreateCriterionAPIViewModel info)
        {
            bool isSuccess = await _criteria.CreateCriterionAsync(info);
            if (isSuccess)
            {
                return Ok("Create criteria successfully");
            }
            return BadRequest("Error while creating criteria");
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("criterion")]
        public async Task<IActionResult> GetAllCriteria()
        {
            List<Criterion> result = await _criteria.GetAllCriterionsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("criterion/{id}")]
        public async Task<IActionResult> GetCriterionById(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid criteria ID.");

            Criterion result = await _criteria.GetCriterionByIdAsync(id);
            if (result == null)
            {
                return NotFound("No criteria found.");
            }
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("criterion/{id}")]
        public async Task<IActionResult> UpdateCriterion(string id, UpdateCriterionAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            bool isSuccess = await _criteria.UpdatCriterionAsync(id, info);
            if (isSuccess)
            {
                return Ok("Criteria update successful!");
            }
            return BadRequest("Error occurred during the criteria update process or event not found.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("criterion/{id}")]
        public async Task<IActionResult> DeleteCriterion(string id)
        {
            bool isSuccess = await _criteria.DeleteCriterionAsync(id);
            if (isSuccess)
            {
                return Ok("Criteria successfully deleted.");
            }
            return BadRequest("The criteria was not found, or an error occurred while deleting.");
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("criterion/{id}/restore")]
        public async Task<IActionResult> RestoreCriterion(string id)
        {
            bool isSuccess = await _criteria.ReActiveCriterionAsync(id);
            if (isSuccess)
            {
                return Ok("Reactive the criteria for success!");
            }
            return BadRequest("The criteria was not found, or an error occurred while recovering.");
        }

        //Manage Template criteria

        [Authorize(Roles ="Admin")]
        [HttpPost("template")]
        public async Task<IActionResult> CreateTemplate(CreateTemplateAPIViewModel info)
        {
            bool isSuccess = await _criteria.CreateTemplateWithMappingsAsync(info);
            if (isSuccess)
            {
                return Ok("Create template successfully.");
            }
            return BadRequest("Error while creating template.");
        }

        [Authorize(Roles ="Admin")]
        [HttpGet("template")]
        public async Task<IActionResult> GetAllTemplates()
        {
            List<CriteriaTemplate> result = await _criteria.GetAllTemplatesAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("template/{id}")]
        public async Task<IActionResult> GetTemplateDetails(string id)
        {
            List<Mapping> result = await _criteria.GetTemplateDetailsAsync(id);
            if (result == null || result.Count == 0)
            {
                return NotFound("No criteria found.");
            }
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("template/{id}")]
        public async Task<IActionResult> UpdateTemplate(string id, UpdateTemplateAPIViewModel info)
        {
            bool isSuccess = await _criteria.UpdateTemplateAsync(id, info);
            if (isSuccess)
            {
                return Ok("Template update successful!");
            }
            return BadRequest("Error occurred during the template update process or event not found.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("template/{id}")]
        public async Task<IActionResult> DeleteTemplate(string id)
        {
            bool isSuccess = await _criteria.DeleteTemplateAsync(id);
            if (isSuccess)
            {
                return Ok("Tempalte successfully deleted.");
            }
            return BadRequest("The template was not found, or an error occurred while deleting.");
        }

    }
}
