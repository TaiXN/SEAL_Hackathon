using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.LeaderBoard
{
    public class CreateLeaderBoardDetailAPIViewModel
    {
        [Required]
        public string TeamInRoundID { get; set; }

        [Required]
        public string LeaderBoardID { get; set; }
    }
}
