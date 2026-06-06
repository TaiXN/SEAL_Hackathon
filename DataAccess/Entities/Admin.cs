using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Admin
{
    public string AdminId { get; set; } = null!;
    public string AccountId { get; set; } = null!;
    public virtual Account Account { get; set; } = null!;

    public virtual ICollection<Track> Tracks { get; set; } = new List<Track>();
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
}