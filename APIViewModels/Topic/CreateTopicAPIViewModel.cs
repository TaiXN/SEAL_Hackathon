using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Topic
{
    public class CreateTopicAPIViewModel
    {
        [Required]
        public string TrackID { get; set; }

        [Required]
        public string TopicDetail { get; set; }
    }
}
