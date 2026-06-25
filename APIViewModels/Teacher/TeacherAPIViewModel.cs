using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Teacher
{
    public class TeacherAPIViewModel
    {
        public string TeacherId { get; set; }
        public string TeacherName { get; set; }
        public string TrackId { get; set; }
        public bool IsMentor { get; set; }
    }
}
