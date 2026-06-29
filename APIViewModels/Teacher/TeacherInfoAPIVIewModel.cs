using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Teacher
{
    public class TeacherInfoAPIVIewModel
    {
        public string TeacherId { get; set; }
        public string TeacherName { get; set; }
        public string Email { get; set; }
        public bool IsGuest { get; set; }
    }
}
