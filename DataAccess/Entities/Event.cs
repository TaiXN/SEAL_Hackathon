using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Event
{
    public string EventId { get; set; } = null!;
    public string AdminId { get; set; } = null!;
    public string EventName { get; set; } = null!;
    public string Season { get; set; } = null!;
    public int Year { get; set; }
    public bool IsActive { get; set; }
    public bool IsDiqualified { get; set; }
    public string DisqualifyReason { get; set; } = null!;
    public virtual Admin Admin { get; set; } = null!;

    
    public virtual ICollection<Track> Tracks { get; set; } = new List<Track>();
    public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();
    public virtual ICollection<Prize> Prizes { get; set; } = new List<Prize>();
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
}