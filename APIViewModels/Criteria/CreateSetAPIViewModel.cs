using System.ComponentModel.DataAnnotations;

namespace APIViewModels.Criteria
{
    public class CreateSetAPIViewModel
    {
        [Required]
        public string SetName { get; set; }
        
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
