using APIViewModels.TeacherList;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.TeacherListService;
using System.Security.Claims;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeacherListController : ControllerBase
    {
        private readonly ITeacherListService _teacherList;
        public TeacherListController(ITeacherListService teacherList)
        {
            _teacherList = teacherList;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateTeacherListAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            bool isCreated = await _teacherList.CreateTeacherListAsync(info);

            if (isCreated) return Ok("Adding teachers to Track was successful!");

            return BadRequest("Error adding teacher. This instructor may already exist in Track.");
        }


        [Authorize(Roles = "Admin")]
        [HttpGet("track/{trackId}")]
        public async Task<IActionResult> GetTeachersByTrack(string trackId)
        {
            if (string.IsNullOrEmpty(trackId)) return BadRequest("Invalid Track ID.");

            List<TeacherList> teachers = await _teacherList.GetTeachersByTrackIdAsync(trackId);

            if (teachers == null || teachers.Count == 0) return NotFound("Not found any teacher in track.");

            return Ok(teachers);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("teacher/{teacherId}/track/{trackId}")]
        public async Task<IActionResult> Update(string teacherId, string trackId, UpdateTeacherListAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (string.IsNullOrEmpty(teacherId) || string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Please enter Teacher ID or Track ID.");
            }

            bool isUpdated = await _teacherList.UpdateTeacherListAsync(teacherId, trackId, info);

            if (isUpdated) return Ok("Change permissions updated successfully.!");

            return BadRequest("Update failed. Data not found or an error occurred.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("teacher/{teacherId}/track/{trackId}")]
        public async Task<IActionResult> Delete(string teacherId, string trackId)
        {
            if (string.IsNullOrEmpty(teacherId) || string.IsNullOrEmpty(trackId))
            {
                return BadRequest("Please enter Teacher ID or Track ID.");
            }

            bool isDeleted = await _teacherList.RemoveTeacherFromTrackAsync(teacherId, trackId);

            if (isDeleted) return Ok("The teacher has been successfully removed from Track");

            return BadRequest("Deletion failed. No data was found to delete.");
        }

    }
}
