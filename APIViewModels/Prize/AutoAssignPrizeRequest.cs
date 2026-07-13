using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Prize
{
    public class AutoAssignPrizeRequest
    {
        public string RoundId { get; set; }
        public string TrackId { get; set; }
        public string EventId { get; set; }
    }
}
