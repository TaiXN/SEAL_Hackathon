using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Prize
{
    public string PrizeId { get; set; } = null!;

    public string PrizeName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string EventId { get; set; } = null!;

    public string? TeamId { get; set; }

    public bool IsActive { get; set; }

    public virtual Event Event { get; set; } = null!;

    public virtual Team? Team { get; set; }
}
