using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Services.AccessTokenService
{
    public class AccessTokenService : IAccessTokenService
    {
        private readonly string PRIVATEKEYJWT = "!@#!@#!@awodjasocdoajdxojasodj!@#!@$!@49293r913jdxadocans";
        public string GenerateJwtToken(string accId,string email,string role)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(PRIVATEKEYJWT));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
        new Claim(JwtRegisteredClaimNames.Email,email),
         new Claim(JwtRegisteredClaimNames.NameId,accId),
        new Claim(ClaimTypes.Role, role)
    };

            var token = new JwtSecurityToken(
                issuer: "SEAL",
                audience: "SEAL_Client",
                claims: claims,
                expires: DateTime.Now.AddMinutes(15),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
