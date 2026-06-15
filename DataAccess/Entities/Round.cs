using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Round
{
    public string RoundId { get; set; } = null!;

    public string EventId { get; set; } = null!;

    public string AdminId { get; set; } = null!;

    public string RoundName { get; set; } = null!;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int TopNpromotion { get; set; }

    public virtual Event Event { get; set; } = null!;


}
