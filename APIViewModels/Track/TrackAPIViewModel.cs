using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Track
{
    public class TrackAPIViewModel
    {
        public string TrackId { get; set; }
        public string EventId { get; set; }
        public string Creator { get; set; }
        public string TrackName { get; set; }
        public bool IsActive { get; set; }
    }
}
