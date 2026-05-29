using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Category
{
    public string CategoryId { get; set; } = null!;

    public string EventId { get; set; } = null!;

    public string Creator { get; set; } = null!;

    public string CategoryName { get; set; } = null!;

    public bool IsActive { get; set; }

    public string Mentor { get; set; } = null!;

    public virtual Event Event { get; set; } = null!;

    public virtual ICollection<Judge> Judges { get; set; } = new List<Judge>();

    public virtual Teacher MentorNavigation { get; set; } = null!;

    public virtual ICollection<TeamJoined> TeamJoineds { get; set; } = new List<TeamJoined>();
}
