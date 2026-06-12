using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Criteria
{
    public class UpdateSetAPIViewModel
    {
        [Required]
        public string SetName { get; set; }

        [Required]
        public bool IsDefault { get; set; }

        public List<CriteriaMappingItemViewModel> CriteriaList { get; set; }
    }


}
