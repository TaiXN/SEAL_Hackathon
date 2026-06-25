using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Event
{
    public string EventId { get; set; } = null!;

    public string Creator { get; set; } = null!;

    public string EventName { get; set; } = null!;

    public string Season { get; set; } = null!;

    public int Year { get; set; }

    public bool IsActive { get; set; }

    public int CurrentRound { get; set; }

    public virtual Account CreatorNavigation { get; set; } = null!;

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    public virtual ICollection<Track> Tracks { get; set; } = new List<Track>();
}
