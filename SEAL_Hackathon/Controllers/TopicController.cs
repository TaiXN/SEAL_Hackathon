using APIViewModels.Topic;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.TopicService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TopicController : ControllerBase
    {
        private readonly ITopicService _topic;
  
        public TopicController(ITopicService topic)
        {
            _topic = topic;
          
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("topic")]
        public async Task<IActionResult> CreateTopic(CreateTopicAPIViewModel info)
        {
            bool isSuccess = await _topic.CreateTopicAsync(info);
            if (isSuccess)
            {
                return Ok("Create topic successfully");
            }
            return BadRequest("Error while creating topic");
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("topic")]
        public async Task<IActionResult> GetAllTopic()
        {
            List<Topic> result = await _topic.GetAllTopicsAsync();
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("topic/{id}")]
        public async Task<IActionResult> GetTopicById(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest("Invalid topic ID.");

            Topic result = await _topic.GetTopicByIdAsync(id);
            if (result == null)
            {
                return NotFound("No criteria found.");
            }
            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("topic/{id}")]
        public async Task<IActionResult> UpdateTopic(string id, UpdateTopicAPIViewModel info)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            bool isSuccess = await _topic.UpdatTopicAsync(id, info);
            if (isSuccess)
            {
                return Ok("Criteria topic successful!");
            }
            return BadRequest("Error occurred during the topic update process or topic not found.");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("topic/{id}")]
        public async Task<IActionResult> DeleteTopic(string id)
        {
            bool isSuccess = await _topic.DeleteTopicAsync(id);
            if (isSuccess)
            {
                return Ok("Topic successfully deleted.");
            }
            return BadRequest("The topic was not found, or an error occurred while deleting.");
        }
    }
}
