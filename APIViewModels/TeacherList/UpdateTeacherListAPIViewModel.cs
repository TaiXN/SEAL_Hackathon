using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.TeacherList
{
    public class UpdateTeacherListAPIViewModel
    {
        [Required]
        public bool IsMentor { get; set; }
    }
}
