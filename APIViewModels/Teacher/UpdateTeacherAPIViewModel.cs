using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Teacher
{
    public class UpdateTeacherAPIViewModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string FullName { get; set; }

        public string Address { get; set; }

        [Phone]
        public string Phone { get; set; }

        public bool IsGuest { get; set; }
    }
}
