using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Prize
{
    public string PrizeId { get; set; } = null!;

    public string PrizeName { get; set; } = null!;

    public string EventId { get; set; } = null!;

    public virtual Event Event { get; set; } = null!;
}
