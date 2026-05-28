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

    public virtual Account CreatorNavigation { get; set; } = null!;

    public virtual Event Event { get; set; } = null!;

    public virtual ICollection<Mapping> Mappings { get; set; } = new List<Mapping>();

    public virtual ICollection<MentorAssignment> MentorAssignments { get; set; } = new List<MentorAssignment>();

    public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
}
