using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Round
{
    public class RoundAPIViewModel
    {
        public string RoundId { get; set; }
        public string EventId { get; set; }
        public string Creator { get; set; }
        public string RoundName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TopNpromotion { get; set; }
        public int MaxTeam { get; set; }
        public bool IsActive { get; set; }
        public int RoundIndex { get; set; }
        public string CriteriaSetId { get; set; }
    }
}
