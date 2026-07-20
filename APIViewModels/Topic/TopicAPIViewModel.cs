using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Topic
{
    public class TopicAPIViewModel
    {
        public string TopicId { get; set; }
        public string TrackId { get; set; }
        public string TopicDetail { get; set; }
        public bool IsActive { get; set; }
    }
}
