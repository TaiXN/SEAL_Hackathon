using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Criteria
{
    public class CreateCriteriaAPIViewModel
    {
        [Required]
        public string CriteriaName { get; set; }
        [Required]
        public int Score { get; set; }
        [Required]
        public string RoundID { get; set; }

    }
}
