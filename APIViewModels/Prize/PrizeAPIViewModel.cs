using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Prize
{
    public class PrizeAPIViewModel
    {
        public string PrizeId { get; set; }
        public string PrizeName { get; set; }
        public string Description { get; set; }
        public string EventId { get; set; }
        public string? TeamId { get; set; }
        public bool IsActive { get; set; }
    }
}
