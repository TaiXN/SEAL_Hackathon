using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Gmail
{
    public class VerifyOtpAPIViewModel
    {
        public string Email { get; set; }
        public string OtpCode { get; set; }
    }
}
