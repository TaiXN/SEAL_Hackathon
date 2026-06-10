using APIViewModels.Admin;
using APIViewModels.Teacher;
using DataAccess.Entities;
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

        private async Task<bool> IsTeacherRole(string roleId)
        {
            Role roleDb = await _role.GetByRoleId(roleId);
            if (roleDb != null && roleDb.RoleName.Equals("Teacher"))
            {
                return true;
            }
            else return false;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTeacherAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
                if (await IsTeacherRole(info.RoleId))
                {
                    string accountId = Guid.NewGuid().ToString();


                    bool isTeacherCreated = await _teacher.CreateAsync(new DataAccess.Entities.Account()
                    {
                        AccountId = accountId,
                        Address = info.Address,
                        Email = info.Email,
                        FullName = info.FullName,
                        Password = info.Password,
                        Phone = info.Phone,
                        RoleId = info.RoleId
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
                else
                {
                    return BadRequest();
                }

            }
            else return BadRequest();
        }
    }
}
