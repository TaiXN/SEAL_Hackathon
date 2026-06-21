using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Student
{
    public string StudentId { get; set; } = null!;

    public string UniversityId { get; set; } = null!;

    public bool IsApproved { get; set; }

    public virtual Account StudentNavigation { get; set; } = null!;

    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();

    public virtual University University { get; set; } = null!;
}
