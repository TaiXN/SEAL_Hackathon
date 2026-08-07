using APIViewModels.Criteria;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.CriteriaService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CriteriaController : ControllerBase
    {
        private readonly ICriteriaService _criteria;
        public CriteriaController(ICriteriaService criteria)
        {
            _criteria = criteria;
          
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

        [Authorize(Roles = "Admin , Judge, Teacher")]
        [HttpGet("criterion")]
        public async Task<IActionResult> GetAllCriteria()
        {
            List<CriterionAPIViewModel> result = await _criteria.GetAllCriterionsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("criterion/{id}")]
        public async Task<IActionResult> GetCriterionById(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid criteria ID.");

            CriterionAPIViewModel result = await _criteria.GetCriterionByIdAsync(id);
            if (result == null)
            {
                return NotFound("No criteria found.");
            }
            return Ok(result);
        }

        [HttpPut("{setId}")]
        public async Task<IActionResult> UpdateCriteriaSet(string setId, [FromBody] UpdateSetAPIViewModel request)
        {
            try
            {
                (bool IsSuccess, string NewSetId) result = await _criteria.UpdateSetAsync(setId, request);

                if (result.IsSuccess)
                {
                    return Ok(new
                    {
                        message = "Successfully updated and cloned the criteria set!",
                        newSetId = result.NewSetId
                    });
                }

                return BadRequest("Update failed. Please ensure the provided data is valid.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
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

        //Manage Set criteria

        [Authorize(Roles ="Admin")]
        [HttpPost("set")]
        public async Task<IActionResult> CreateSet(CreateSetAPIViewModel info)
        {
            bool isSuccess = await _criteria.CreateSetWithMappingsAsync(info);
            if (isSuccess)
            {
                return Ok("Create set successfully.");
            }
            return BadRequest("Error while creating set.");
        }

        [Authorize(Roles = "Admin , Judge, Teacher")]
        [HttpGet("set")]
        public async Task<IActionResult> GetAllSets()
        {
            List<CriteriaSetAPIViewModel> result = await _criteria.GetAllSetsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin , Judge, Teacher")]
        [HttpGet("set/{id}")]
        public async Task<IActionResult> GetSetDetails(string id)
        {
            List<MappingDetailAPIViewModel> result = await _criteria.GetSetDetailsAsync(id);
            if (result == null || result.Count == 0)
            {
                return NotFound("No criteria found.");
            }
            return Ok(result);
        }
    

        [Authorize(Roles = "Admin")]
        [HttpDelete("set/{id}")]
        public async Task<IActionResult> DeleteSet(string id)
        {
            bool isSuccess = await _criteria.DeleteSetAsync(id);
            if (isSuccess)
            {
                return Ok("Set successfully deleted.");
            }
            return BadRequest("The set was not found, or an error occurred while deleting.");
        }

    }
}
