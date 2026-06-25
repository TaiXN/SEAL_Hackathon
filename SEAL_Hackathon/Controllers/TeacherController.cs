using APIViewModels.Teacher;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.AccountService;
using Services.RoleService;
using Services.TeacherService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeacherController : ControllerBase
    {
        private readonly IAccountService _account;
        private readonly ITeacherService _teacher;
        private readonly IRoleService _role;
        public TeacherController(IAccountService account, ITeacherService teacher, IRoleService role)
        {
            _account = account;
            _teacher = teacher;
            _role = role;
        }


        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CreateTeacherAPIViewModel info)
        {
            if (ModelState.IsValid)
            {

                string accountId = Guid.NewGuid().ToString();


                bool isTeacherCreated = await _teacher.CreateAsync(new DataAccess.Entities.Account()
                {
                    AccountId = accountId,
                    Address = info.Address,
                    Email = info.Email,
                    FullName = info.FullName,
                    Password = info.Password,
                    Phone = info.Phone
                }, info.IsGuest);
                if (isTeacherCreated)
                {
                    return Ok("Create teacher successfully");
                }
                else
                {
                    return BadRequest("Error while create teacher");
                }


            }
            else return BadRequest();
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            
            List<TeacherAPIViewModel> result = await _teacher.GetAllAsync();

           
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin, Teacher")]
        public async Task<IActionResult> GetById(string id)
        {
            Teacher result = await _teacher.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound("Teacher not found");
            }
            return Ok(result);
        }


        [HttpPut("{id}")]
        [Authorize(Roles = "Admin, Teacher")]
        public async Task<IActionResult> Update(string id, UpdateTeacherAPIViewModel info)
        {
            if (ModelState.IsValid)
            {

                bool isUpdated = await _teacher.UpdateAsync(id, new Account()
                {
                    Email = info.Email,
                    FullName = info.FullName,
                    Address = info.Address,
                    Phone = info.Phone
                }, info.IsGuest);

                if (isUpdated)
                {
                    return Ok("Update teacher successfully");
                }
                else
                {
                    return BadRequest("Error while updating teacher (ID not found or duplicate Email)");
                }
            }
            else return BadRequest();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            bool isDeleted = await _teacher.DeleteAsync(id);
            if (isDeleted)
            {
                return Ok("Delete teacher successfully");
            }
            else
            {
                return BadRequest("Error while deleting teacher (ID not found)");
            }
        }
    }
}
