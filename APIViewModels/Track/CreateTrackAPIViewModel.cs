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

        [Required]
        [Range(1, 9999, ErrorMessage = "MaxTeam must be greater than 0")]
        public int MaxTeam { get; set; }

    }
}
