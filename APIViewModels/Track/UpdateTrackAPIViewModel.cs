using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Track
{
    public class UpdateTrackAPIViewModel
    {
        [Required]
        public string TrackName { get; set; }

        [Required]
        public string EventID { get; set; }
    }
}
