using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Category
{
    public class RemoveJudgeAPIViewModel
    {
        [Required]
        public string CategoryId { get; set; }
        [Required]
        public string TeacherId { get; set; }
    }
}
