using System.ComponentModel.DataAnnotations;

namespace APIViewModels.TeamProject
{
    public class SubmitProjectAPIViewModel
    {
        
        public string CategoryId { get; set; }

        
        public string TopicName { get; set; }

        public string Description { get; set; }
    }
}