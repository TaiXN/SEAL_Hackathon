using APIViewModels.Event;
using APIViewModels.Mentor;
using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Category
{
    public class BasicCategoryAPIViewModel
    {
        public string CategoryId { get; set; }
        public BasicEventAPIViewModel Event { get; set; }
        public string CategoryName { get; set; }
        public bool IsActive { get; set; }
        public MentorAPIViewModel Mentor { get; set; }

    }
}
