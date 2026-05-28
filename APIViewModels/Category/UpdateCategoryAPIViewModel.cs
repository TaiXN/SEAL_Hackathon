using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Category
{
    public class UpdateCategoryAPIViewModel
    {
        [Required]
        public string CategoryName { get; set; }
        [Required]
        public string EventID { get; set; }
    }
}
