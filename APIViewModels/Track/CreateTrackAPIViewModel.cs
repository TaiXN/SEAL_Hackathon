using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Track
{
    public class CreateTrackAPIViewModel
    {
        [Required]
        public string EventId { get; set; }

        [Required]
        public string TrackName { get; set; }

    }
}
