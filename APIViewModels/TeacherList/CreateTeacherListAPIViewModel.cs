using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.TeacherList
{
    public class CreateTeacherListAPIViewModel
    {
        [Required]
        public string TeacherID { get; set; }
        [Required]
        public string TrackID { get; set; }
        [Required]
        public bool IsMentor { get; set; }
    }
}
