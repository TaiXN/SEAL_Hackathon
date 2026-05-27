using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Auth
{
    public class LoginResultAPIViewModel
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }
}
