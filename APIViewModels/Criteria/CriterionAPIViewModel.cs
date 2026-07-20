using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Criteria
{
    public class CriterionAPIViewModel
    {
        public string CriteriaId { get; set; }
        public string CriteriaName { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}
