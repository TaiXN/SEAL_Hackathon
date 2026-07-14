using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Prize
{
    public class PrizeResponseAPIViewModel
    {
        public string Id { get; set; }
        public string PrizeName { get; set; }
        public string Description { get; set; }
        public int IsActive { get; set; }
        public string EventId { get; set; }
        public string? TeamId { get; set; }
    }
}
