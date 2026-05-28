using APIViewModels.Category;
using APIViewModels.Event;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.AdminService;
using Services.CategoryService;
using Services.EventService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _category;
        private readonly IAdminService _admin;
        public CategoryController(ICategoryService category, IAdminService admin)
        {
            _category = category;
            _admin = admin;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateCategoryAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                DataAccess.Entities.Category newCategory = new DataAccess.Entities.Category()
                {
                    CategoryId = Guid.NewGuid().ToString(),
                    EventId = info.EventID,
                    Creator = accId,
                    CategoryName = info.CategoryName,
                    IsActive = true
                };
                bool isCreated = await _category.CreateCategoryAsync(newCategory);
                if (isCreated)
                {
                    return Ok("Create category successfully");
                }
                else
                {
                    return BadRequest("Error while creating category");
                }
            }
            else
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var category = await _category.GetAllCategorysAsync();
            return Ok(category);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Invalid category ID.");
            }

            var currentCategory = await _category.GetCategoryByIdAsync(id);

            if (currentCategory == null)
            {
                return NotFound("No category found.");
            }

            return Ok(currentCategory);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateCategoryAPIViewModel info)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingCategory = await _category.GetCategoryByIdAsync(id);
            if (existingCategory == null)
            {
                return NotFound("No category found to update.");
            }

            existingCategory.CategoryName = info.CategoryName;
            existingCategory.EventId = info.EventID;

            bool isUpdated = await _category.UpdateCategoryAsync(existingCategory);

            if (isUpdated)
            {
                return Ok("Category update successful!");
            }

            return BadRequest("Error occurred during the category update process.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                return BadRequest("Invalid category ID.");
            }

            bool isDeleted = await _category.DeleteCategoryAsync(id);

            if (isDeleted)
            {
                return Ok("Category successfully deleted.");
            }

            return BadRequest("The category was not found, or an error occurred while deleting.");
        }
    }
}
