using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Auth
{
    public class UpdateNewPasswordAPIViewModel
    {
        [Required]
        [MinLength(8)]
        public string OldPassword { get; set; }
        
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }
        
        [Required]
        [MinLength(8)]
        public string RePassword { get; set; }
    }
}
