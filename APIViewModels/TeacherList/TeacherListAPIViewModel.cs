using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.TeacherList
{
    public class TeacherListAPIViewModel
    {
        [Required]
        public string TrackID { get; set; }
        [Required]
        public string TeacherID { get; set; }
    }
}
