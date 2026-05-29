using APIViewModels.Category;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.AdminService;
using Services.CategoryService;
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
        [HttpPost("judge")]
        public async Task<IActionResult> AddJudge(AddJudgeAPIViewModel judgeInfo)
        {
            if (ModelState.IsValid)
            {
                string result = await _category.AddJudgeAsync(judgeInfo);
                if (result.Equals("Ok"))
                {
                    return Ok("Add judge successful");
                }
                else
                {
                    return BadRequest(result);
                }
            }
            else
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("mentor")]
        public async Task<IActionResult> ChangeMentor(ChangeMentorAPIViewModel mentorInfo)
        {
            if (ModelState.IsValid)
            {
                bool isChanged = await _category.ChangeMentorAsync(mentorInfo);
                if (isChanged)
                {
                    return Ok("Update mentor successful");
                }
                else
                {
                    return BadRequest();
                }
            }
            else
            {
                return BadRequest();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateCategoryAPIViewModel cateInfo)
        {
            if (ModelState.IsValid)
            {
                Dictionary<string, CreateJudgeAPIViewModel> checkDuplicateList = new Dictionary<string, CreateJudgeAPIViewModel>();
                
                foreach (CreateJudgeAPIViewModel judge in cateInfo.Judges)
                {
                    try
                    {
                        checkDuplicateList.Add(judge.TeacherId, judge);
                    }
                    catch(Exception ex)
                    {
                        return BadRequest("Jugde is duplicate");
                    }
                    if(judge.TeacherId == cateInfo.MentorId)
                    {
                        return BadRequest("Jugde already is a mentor for this category");
                    }
                }
                string accId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;//middeware

                bool isCreated = await _category.CreateAsync(cateInfo, accId);
                if (isCreated)
                {
                    return Ok("Create category successful");
                }
                else return StatusCode(StatusCodes.Status500InternalServerError);
            }
            else
            {
                return BadRequest();
            }
          


        }

    }
}
