using APIViewModels.Admin;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Services.AccountService;
using Services.AdminService;
using Services.RoleService;


namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAccountService _account;
        private readonly IAdminService _admin;
        private readonly IRoleService _role;
        public AdminController(IAccountService account, IAdminService admin, IRoleService role)
        {
            _account = account;
            _admin = admin;
            _role = role;
        }

      
        [Authorize(Roles ="Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateAdminAPIViewModel info)
        {
            if (ModelState.IsValid)
            {
            
                    string accountId = Guid.NewGuid().ToString();

                    bool isAdminCreated = await _admin.CreateAsync(new DataAccess.Entities.Account()
                    {
                        AccountId = accountId,
                        Address = info.Address,
                        Email = info.Email,
                        FullName = info.FullName,
                        Password = info.Password,
                        Phone = info.Phone
                     
                    });
                    if (isAdminCreated)
                    {
                        return Ok("Create admin successfully");
                    }
                    else
                    {
                        return BadRequest("Error while create admin");
                    }
               

            }
            else return BadRequest();
        }


    }
}
