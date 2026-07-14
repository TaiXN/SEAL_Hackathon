using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Prize
{
    public class CreatePrizeAPIViewModel
    {
        [Required]
        public string PrizeName { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public string EventId { get; set; }
    }
}
