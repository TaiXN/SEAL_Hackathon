using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Track
{
    public string TrackId { get; set; } = null!;

    public string EventId { get; set; } = null!;

    public string Creator { get; set; } = null!;

    public string TrackName { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual Event Event { get; set; } = null!;

    public virtual ICollection<LeaderBoard> LeaderBoards { get; set; } = new List<LeaderBoard>();

    public virtual ICollection<TeacherList> TeacherLists { get; set; } = new List<TeacherList>();

    public virtual ICollection<TeamInRound> TeamInRounds { get; set; } = new List<TeamInRound>();

    public virtual ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
