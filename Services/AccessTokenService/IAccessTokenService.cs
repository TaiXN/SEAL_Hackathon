using System;
using System.Collections.Generic;
using System.Text;

namespace Services.AccessTokenService
{
    public interface IAccessTokenService
    {
        string GenerateJwtToken(string accId, string email, string role);
    }
}
