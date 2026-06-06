using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Round
{
    public class CreateRoundAPIViewModel
    {
        [Required]
        public string EventID { get; set; }

        [Required]
        public string RoundName { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public int TopNPromotion { get; set; }

        [Required]
        public int MaxTeam { get; set; }
        [Required]
        public int RoundIndex { get; set; }
    }
}
