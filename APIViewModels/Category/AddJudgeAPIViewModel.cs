using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Category
{
    public class AddJudgeAPIViewModel
    {
        [Required]
        public string CategoryId { get; set; }
        [Required]
        [MinLength(1)]
        public List<CreateJudgeAPIViewModel> NewJudges { get; set; }
    }
}
