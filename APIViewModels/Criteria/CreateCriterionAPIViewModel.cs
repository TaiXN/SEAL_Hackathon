using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Criteria
{
    public class CreateCriterionAPIViewModel
    {
        [Required]
        public string CriteriaName { get; set; }
        [Required]
        public string Description { get; set; }
    }
}
