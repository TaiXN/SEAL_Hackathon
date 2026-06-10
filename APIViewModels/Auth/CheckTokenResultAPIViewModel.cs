using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Auth
{
    public class CheckTokenResultAPIViewModel
    {
        public string AccId { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }
}
