using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Judge
{
    public class JudgeAPIViewModel
    {
        public string Id { get; set; }
        public string TeacherId { get; set; }
        public string CategoryName { get; set; }
        public bool IsGuest { get; set; }
        public string CategoryId { get; set; }
        public string AccId { get; set; }
        public string Fullname { get; set; }
        public string Email { get; set; }
    }
}
