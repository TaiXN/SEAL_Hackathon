using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Prize
{
    public class PrizeAPIViewModel
    {
        [Required]
        public string PrizeId { get; set; }
        public string TeamId { get; set; }
    }
}
