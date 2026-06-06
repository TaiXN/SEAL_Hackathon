using APIViewModels.Category;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Criteria
{
    public class CreateTemplateAPIViewModel
    {
        [Required]
        public string TemplateName { get; set; }
        
        [Required]
        public bool IsDefault { get; set; }

        public List<CriteriaMappingItemViewModel> CriteriaList { get; set; }
    }

    public class CriteriaMappingItemViewModel
    {
        [Required]
        public string CriteriaId { get; set; }

        [Required]
        public int Score { get; set; } 
    }
}
