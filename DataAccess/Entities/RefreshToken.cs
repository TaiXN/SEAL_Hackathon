using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class RefreshToken
{
    public string TokenId { get; set; } = null!;

    public string AccountId { get; set; } = null!;

    public string TokenValue { get; set; } = null!;

    public DateTime ExpiredDate { get; set; }

    public bool IsRevoked { get; set; }

    public virtual Account Account { get; set; } = null!;
}
