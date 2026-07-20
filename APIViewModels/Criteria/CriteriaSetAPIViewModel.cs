using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Criteria
{
    public class CriteriaSetAPIViewModel
    {
        public string CriteriaSetId { get; set; }
        public string SetName { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }
}
