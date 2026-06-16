using System;
using System.Collections.Generic;

namespace DataAccess.Entities;

public partial class Teacher
{
    public string Id { get; set; } = null!;

    public bool IsGuest { get; set; }

    public virtual Account IdNavigation { get; set; } = null!;

    public virtual ICollection<TeacherList> TeacherLists { get; set; } = new List<TeacherList>();
}
