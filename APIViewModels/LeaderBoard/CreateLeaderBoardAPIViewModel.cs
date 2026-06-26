using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.LeaderBoard
{
    public class CreateLeaderBoardAPIViewModel
    {
        [Required]
        public string ID { get; set; }
        [Required]
        public string TrackID { get; set; }

        [Required]
        public string RoundID { get; set; }
    }
}
