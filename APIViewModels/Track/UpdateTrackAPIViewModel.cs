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

        [Range(1, 9999, ErrorMessage = "MaxTeam must be greater than 0")]
        public int MaxTeam { get; set; }
    }
}
